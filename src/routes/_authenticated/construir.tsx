import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { construirResposta } from "@/lib/construir.functions";

export const Route = createFileRoute("/_authenticated/construir")({
  head: () => ({
    meta: [
      { title: "Construir resposta — Suporte RAL+" },
      { name: "description", content: "Cole o corpo do ticket e obtenha uma resposta baseada no manual do Suporte RAL+." },
      { property: "og:title", content: "Construir resposta — Suporte RAL+" },
      { property: "og:description", content: "Cole o corpo do ticket e obtenha uma resposta baseada no manual do Suporte RAL+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Construir,
});

function Construir() {
  const run = useServerFn(construirResposta);
  const [ticket, setTicket] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const build = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await run({ data: { ticket } });
      setAnswer(r.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(answer.replace(/^Baseado em:.*\n+/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Construir resposta</h1>
        <Link to="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">← Pesquisa</Link>
      </div>
      <p className="mt-1 text-muted-foreground">Cole o corpo do ticket. A resposta é construída só com as respostas guardadas na aplicação.</p>
      <textarea
        value={ticket}
        onChange={(e) => setTicket(e.target.value)}
        rows={10}
        placeholder="Cole aqui o texto do ticket…"
        className="mt-6 w-full rounded-xl border bg-card p-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        onClick={build}
        disabled={loading || !ticket.trim()}
        className="mt-3 rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "A construir…" : "Construir resposta"}
      </button>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {answer && (
        <div className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={16}
            className="w-full rounded-lg bg-muted p-4 font-sans text-sm leading-relaxed outline-none"
          />
          <button onClick={copy} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {copied ? "Copiado ✓" : "Copiar resposta"}
          </button>
        </div>
      )}
    </main>
  );
}
