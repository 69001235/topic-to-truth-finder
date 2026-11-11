import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { customQuery } from "@/lib/respostas";
import { permissoesQuery, type Permissoes } from "@/lib/permissoes";

import { useMemo, useRef, useState } from "react";
import { searchTemplates, type Template } from "@/lib/search";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/field";
import { useConfirm } from "@/components/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      {
        name: "description",
        content: "Pesquise um tema e obtenha a resposta standard do Suporte RAL+.",
      },
      { property: "og:title", content: "Respostas Suporte RAL+" },
      {
        property: "og:description",
        content: "Pesquise um tema e obtenha a resposta standard do Suporte RAL+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const suggestions = [
  "anexos",
  "CMD",
  "advogado",
  "estrangeiro",
  "duplicado",
  "fatura bloqueada",
  "fechar ticket",
];

function greeting() {
  const h = new Date().getHours();
  return h < 13 ? "Bom dia" : h < 20 ? "Boa tarde" : "Boa noite";
}

function ResultCard({
  t,
  open,
  uuid,
  perms,
  q,
  confirmRemove,
}: {
  t: Template;
  open: boolean;
  uuid?: string | undefined;
  perms: Permissoes;
  q: string;
  confirmRemove: (title: string) => Promise<boolean>;
}) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const text = t.text.replace(/^Bom dia,/, `${greeting()},`);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const remove = async () => {
    if (!uuid || !(await confirmRemove(t.title))) return;
    await supabase.from("respostas").delete().eq("id", uuid);
    qc.invalidateQueries({ queryKey: ["respostas"] });
  };

  return (
    <details open={open} className="group rounded-md border bg-card">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 md:p-5 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 rounded-sm border bg-muted px-2 py-0.5 font-mono text-sm">
          <span className="sr-only">Referência </span>
          {t.id}
        </span>
        <h4 className="min-w-0 flex-1 text-base font-semibold">{t.title}</h4>
        <span className="hidden text-sm text-muted-foreground sm:inline">{t.category}</span>
        <ChevronDown aria-hidden="true" className="mt-0.5 size-5 shrink-0 group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t p-4 md:p-5">
        {t.note && (
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Quando usar: </span>
            {t.note}
          </p>
        )}
        <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted p-4 font-sans text-base leading-relaxed">
          {text}
        </pre>
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
          {uuid && perms.edit && (
            <Link
              to="/gerir"
              search={{ editar: uuid, q }}
              className={buttonVariants({ variant: "secondary" })}
            >
              Editar<span className="sr-only"> resposta {t.title}</span>
            </Link>
          )}
          {uuid && perms.delete && (
            <Button type="button" variant="danger" onClick={remove}>
              Apagar<span className="sr-only"> resposta {t.title}</span>
            </Button>
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
  const { confirm, dialog } = useConfirm();
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const { data: perms } = useQuery(permissoesQuery);
  const { data: custom = [] } = useQuery({ ...customQuery, enabled: !!perms?.search });
  const results = useMemo(() => {
    const r = searchTemplates(q, custom);
    if (q.trim()) return r;
    const key = (id: string) => (id === "+" ? "999" : id);
    return [...r].sort((a, b) => key(a.id).localeCompare(key(b.id), undefined, { numeric: true }));
  }, [q, custom]);
  /** Groups by major theme, keeping the order in which themes first appear. */
  const groups = useMemo(() => {
    const m = new Map<string, Template[]>();
    for (const t of results) m.set(t.category, [...(m.get(t.category) ?? []), t]);
    return [...m.entries()];
  }, [results]);

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    window.location.reload();
  };

  const confirmRemove = (title: string) =>
    confirm({
      title: "Apagar esta resposta?",
      description: `Vai apagar a resposta «${title}». Esta ação não pode ser anulada.`,
      confirmLabel: "Apagar",
      destructive: true,
    });

  if (!perms) return null;
  if (!perms.search)
    return (
      <AppShell perms={perms} onSignOut={perms.signedIn ? signOut : undefined}>
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 space-y-4 lg:col-span-8 lg:col-start-3">
            <h1>Respostas Suporte RAL+</h1>
            {perms.signedIn ? (
              <>
                <Alert variant="warning">
                  A conta {perms.email} ainda não tem acesso. Peça a um administrador para a
                  autorizar.
                </Alert>
                <div>
                  <Button type="button" variant="secondary" onClick={signOut}>
                    Sair
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p>Entre com uma conta autorizada para pesquisar respostas.</p>
                <div>
                  <Link to="/auth" className={buttonVariants()}>
                    Entrar
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </AppShell>
    );

  const count = results.length;
  const term = q.trim();

  return (
    <AppShell perms={perms} searchTerm={q} onSignOut={signOut}>
      <div className="grid grid-cols-12 gap-x-6 gap-y-6">
        <div className="col-span-12 space-y-2 lg:col-span-10 lg:col-start-2">
          <h1>Pesquisar respostas</h1>
          <p className="text-muted-foreground">
            Escreva o tema do ticket e copie a resposta a dar.
          </p>
        </div>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            resultsRef.current?.focus();
          }}
          className="col-span-12 space-y-4 lg:col-span-10 lg:col-start-2"
        >
          <Field label="Tema do ticket">
            {(control) => (
              <Input
                {...control}
                type="search"
                autoComplete="off"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex.: não consegue anexar excel"
              />
            )}
          </Field>
          <Button type="submit">Pesquisar</Button>
        </form>

        <div className="col-span-12 space-y-2 lg:col-span-10 lg:col-start-2">
          <p id="sugestoes" className="font-semibold">
            Sugestões de pesquisa
          </p>
          <ul aria-labelledby="sugestoes" className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setQ(s)}>
                  {s}
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <section
          aria-labelledby="resultados"
          className="col-span-12 space-y-4 lg:col-span-10 lg:col-start-2"
        >
          <h2 id="resultados" ref={resultsRef} tabIndex={-1}>
            Resultados
          </h2>
          <div role="status">
            {count === 0 ? (
              <Alert variant="info" role="none">
                Nenhuma resposta encontrada para este tema.
              </Alert>
            ) : (
              <p className="text-muted-foreground">
                {count} {count === 1 ? "resposta" : "respostas"}
                {term ? ` para «${term}»` : ""}
              </p>
            )}
          </div>
          {groups.map(([cat, items]) => (
            <section key={cat} aria-label={cat} className="space-y-3">
              <h3 className="pt-4">
                {cat} <span className="font-normal text-muted-foreground">({items.length})</span>
              </h3>
              {items.map((t) => (
                <ResultCard
                  key={"uuid" in t ? String(t.uuid) : t.id}
                  t={t}
                  uuid={"uuid" in t ? String(t.uuid) : undefined}
                  perms={perms}
                  q={q}
                  confirmRemove={confirmRemove}
                  open={!!q.trim() && t === results[0]}
                />
              ))}
            </section>
          ))}
        </section>
      </div>
      {dialog}
    </AppShell>
  );
}
