CREATE TABLE public.respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  keywords text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  text text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.respostas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.respostas TO authenticated;
GRANT ALL ON public.respostas TO service_role;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler" ON public.respostas FOR SELECT USING (true);
CREATE POLICY "Autenticados criam" ON public.respostas FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Autenticados editam" ON public.respostas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Autenticados apagam" ON public.respostas FOR DELETE TO authenticated USING (true);