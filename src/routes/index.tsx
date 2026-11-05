import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { customQuery } from "@/lib/respostas";
import { permissoesQuery, type Permissoes } from "@/lib/permissoes";

import { useMemo, useState } from "react";
import { searchTemplates, type Template } from "@/lib/search";

/** Keeps the typed search term in the URL so returning from editing lands back on it. */
export const indexSearch = (s: Record<string, unknown>): { q?: string } => {
  const q = typeof s["q"] === "string" ? s["q"] : "";
  return q ? { q } : {};
};

export const Route = createFileRoute("/")({
  validateSearch: indexSearch,
  head: () => ({
    meta: [
      { title: "Respostas Suporte RAL+" },
      { name: "description", content: "Pesquise um tema e obtenha a resposta standard do Suporte RAL+." },
      { property: "og:title", content: "Respostas Suporte RAL+" },
      { property: "og:description", content: "Pesquise um tema e obtenha a resposta standard do Suporte RAL+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const suggestions = ["anexos", "CMD", "advogado", "estrangeiro", "duplicado", "fatura bloqueada", "fechar ticket"];

function greeting() {
  const h = new Date().getHours();
  return h < 13 ? "Bom dia" : h < 20 ? "Boa tarde" : "Boa noite";
}

function Card({ t, open, uuid, perms, q }: { t: Template; open: boolean; uuid?: string | undefined; perms: Permissoes; q: string }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const text = t.text.replace(/^Bom dia,/, `${greeting()},`);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const remove = async () => {
    if (!uuid || !confirm("Apagar esta resposta?")) return;
    await supabase.from("respostas").delete().eq("id", uuid);
    qc.invalidateQueries({ queryKey: ["respostas"] });
  };

  return (
    <details open={open} className="group rounded-xl border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5">
        <span className="rounded-md bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">{t.id}</span>
        <span className="flex-1 font-semibold">{t.title}</span>
        <span className="text-xs text-muted-foreground">{t.category}</span>
      </summary>
      <div className="border-t px-5 pb-5 pt-4">
        {t.note && <p className="mb-3 text-sm italic text-muted-foreground">{t.note}</p>}
        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm leading-relaxed">{text}</pre>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={copy}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {copied ? "Copiado ✓" : "Copiar resposta"}
          </button>
          {uuid && perms.edit && (
            <Link to="/gerir" search={{ editar: uuid, q }} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
              Editar
            </Link>
          )}
          {uuid && perms.delete && (
            <button onClick={remove} className="rounded-md border px-4 py-2 text-sm font-medium text-destructive hover:bg-accent">
              Apagar
            </button>
          )}
        </div>

      </div>
    </details>
  );
}

function Index() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const qc = useQueryClient();
  const { data: perms } = useQuery(permissoesQuery);
  const { data: custom = [] } = useQuery({ ...customQuery, enabled: !!perms?.search });
  const results = useMemo(() => searchTemplates(q, custom), [q, custom]);

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    window.location.reload();
  };

  if (!perms) return null;
  if (!perms.search)
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Respostas Suporte RAL+</h1>
        {perms.signedIn ? (
          <>
            <p className="mt-3 text-muted-foreground">A conta {perms.email} ainda não tem acesso. Peça a um administrador para a autorizar.</p>
            <button onClick={signOut} className="mt-6 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">Sair</button>
          </>
        ) : (
          <>
            <p className="mt-3 text-muted-foreground">Entre com uma conta autorizada para pesquisar respostas.</p>
            <Link to="/auth" className="mt-6 inline-block rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground">Entrar</Link>
          </>
        )}
      </main>
    );

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Respostas Suporte RAL+</h1>
        <div className="flex flex-wrap justify-end gap-2">
          <Link to="/construir" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Construir resposta</Link>
          {perms.create && <Link to="/gerir" search={q ? { q } : {}} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">+ Adicionar resposta</Link>}
          {perms.admin && <Link to="/utilizadores" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">Utilizadores</Link>}
          <button onClick={signOut} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent">Sair</button>
        </div>
      </div>
      <p className="mt-1 text-muted-foreground">Escreva o tema do ticket e copie a resposta a dar.</p>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ex.: não consegue anexar excel"
        className="mt-6 w-full rounded-xl border bg-card px-5 py-4 text-lg shadow-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => setQ(s)} className="rounded-full border px-3 py-1 text-sm hover:bg-accent">
            {s}
          </button>
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {results.length === 0 && <p className="text-muted-foreground">Nenhuma resposta encontrada para este tema.</p>}
        {results.map((t, i) => (
          <Card
            key={"uuid" in t ? String(t.uuid) : t.id}
            t={t}
            uuid={"uuid" in t ? String(t.uuid) : undefined}
            perms={perms}
            q={q}
            open={!!q.trim() && i === 0}
          />

        ))}

      </div>
    </main>
  );
}
