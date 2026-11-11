import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { useState } from "react";
import { construirResposta } from "@/lib/construir.functions";
import { permissoesQuery } from "@/lib/permissoes";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Field } from "@/components/field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/construir")({
  head: () => ({
    meta: [
      { title: "Construir resposta — Suporte RAL+" },
      {
        name: "description",
        content: "Cole o corpo do ticket e obtenha uma resposta baseada no manual do Suporte RAL+.",
      },
      { property: "og:title", content: "Construir resposta — Suporte RAL+" },
      {
        property: "og:description",
        content: "Cole o corpo do ticket e obtenha uma resposta baseada no manual do Suporte RAL+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Construir,
});

function Construir() {
  const run = useServerFn(construirResposta);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: perms } = useQuery(permissoesQuery);
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

  const signOut = async () => {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell perms={perms} onSignOut={signOut}>
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 space-y-6 lg:col-span-8 lg:col-start-3">
          <div>
            <Breadcrumbs>
              <li>
                <Link to="/" className="link">
                  Pesquisa
                </Link>
              </li>
              <li>
                <span aria-current="page">Construir resposta</span>
              </li>
            </Breadcrumbs>
            <h1>Construir resposta</h1>
            <p className="mt-2 text-muted-foreground">
              Cole o corpo do ticket. A resposta é construída só com as respostas guardadas na
              aplicação.
            </p>
          </div>

          <Field label="Texto do ticket">
            {(control) => (
              <Textarea
                {...control}
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                rows={10}
                placeholder="Cole aqui o texto do ticket…"
              />
            )}
          </Field>

          <div>
            <Button
              type="button"
              variant={answer ? "secondary" : "default"}
              onClick={build}
              disabled={loading || !ticket.trim()}
              aria-busy={loading}
            >
              {loading ? "A construir…" : "Construir resposta"}
            </Button>
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          {answer && (
            <section
              aria-labelledby="resposta-construida"
              className="space-y-4 rounded-md border p-4 md:p-6"
            >
              <h2 id="resposta-construida">Resposta construída</h2>
              <Field label="Resposta" hint="Pode editar o texto antes de copiar.">
                {(control) => (
                  <Textarea
                    {...control}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={16}
                    className="font-sans leading-relaxed"
                  />
                )}
              </Field>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={copy}>
                  {copied ? (
                    <>
                      <Check aria-hidden="true" />
                      Copiado
                    </>
                  ) : (
                    "Copiar resposta"
                  )}
                </Button>
                <span role="status" className="sr-only">
                  {copied ? "Resposta copiada para a área de transferência." : ""}
                </span>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
