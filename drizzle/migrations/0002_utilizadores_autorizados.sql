CREATE TABLE public.utilizadores (
  email text PRIMARY KEY CHECK (email = lower(email)),
  is_admin boolean NOT NULL DEFAULT false,
  can_search boolean NOT NULL DEFAULT true,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utilizadores TO authenticated;
GRANT ALL ON public.utilizadores TO service_role;
ALTER TABLE public.utilizadores ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tem_permissao(_perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT CASE _perm
      WHEN 'admin' THEN u.is_admin
      WHEN 'search' THEN u.can_search OR u.is_admin
      WHEN 'create' THEN u.can_create OR u.is_admin
      WHEN 'edit' THEN u.can_edit OR u.is_admin
      WHEN 'delete' THEN u.can_delete OR u.is_admin
      ELSE false END
    FROM public.utilizadores u
    WHERE u.email = lower(auth.jwt() ->> 'email')
  ), false)
$$;
GRANT EXECUTE ON FUNCTION public.tem_permissao(text) TO authenticated;

CREATE POLICY "Ver o próprio ou admin" ON public.utilizadores FOR SELECT TO authenticated
  USING (email = lower(auth.jwt() ->> 'email') OR public.tem_permissao('admin'));
CREATE POLICY "Admin cria" ON public.utilizadores FOR INSERT TO authenticated WITH CHECK (public.tem_permissao('admin'));
CREATE POLICY "Admin altera" ON public.utilizadores FOR UPDATE TO authenticated USING (public.tem_permissao('admin'));
CREATE POLICY "Admin apaga" ON public.utilizadores FOR DELETE TO authenticated USING (public.tem_permissao('admin'));

DROP POLICY IF EXISTS "Todos podem ler" ON public.respostas;
DROP POLICY IF EXISTS "Autenticados criam" ON public.respostas;
DROP POLICY IF EXISTS "Autenticados editam" ON public.respostas;
DROP POLICY IF EXISTS "Autenticados apagam" ON public.respostas;
REVOKE SELECT ON public.respostas FROM anon;
CREATE POLICY "Autorizados pesquisam" ON public.respostas FOR SELECT TO authenticated USING (public.tem_permissao('search'));
CREATE POLICY "Autorizados criam" ON public.respostas FOR INSERT TO authenticated WITH CHECK (public.tem_permissao('create') AND auth.uid() = created_by);
CREATE POLICY "Autorizados alteram" ON public.respostas FOR UPDATE TO authenticated USING (public.tem_permissao('edit'));
CREATE POLICY "Autorizados apagam" ON public.respostas FOR DELETE TO authenticated USING (public.tem_permissao('delete'));