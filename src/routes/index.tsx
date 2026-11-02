import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { customQuery } from "@/lib/respostas";
import { useMemo, useState } from "react";
import { searchTemplates, templates, type Template } from "@/lib/search";

export const Route = createFileRoute("/")({
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

function Card({ t, open, uuid }: { t: Template; open: boolean; uuid?: string }) {
  const [copied, setCopied] = useState(false);
  const text = t.text.replace(/^Bom dia,/, `${greeting()},`);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          {uuid && (
            <Link
              to="/gerir"
              search={{ editar: uuid }}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Editar
            </Link>
          )}
        </div>

      </div>
    </details>
  );
}

function Index() {
  const [q, setQ] = useState("");
  const { data: custom = [] } = useQuery(customQuery);
  const results = useMemo(() => searchTemplates(q, [...custom, ...templates]), [q, custom]);
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Respostas Suporte RAL+</h1>
        <Link to="/gerir" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">+ Adicionar resposta</Link>
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
          <Card key={"uuid" in t ? String(t.uuid) : t.id} t={t} open={!!q.trim() && i === 0} />
        ))}
      </div>
    </main>
  );
}
