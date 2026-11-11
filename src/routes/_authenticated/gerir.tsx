import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { customQuery } from "@/lib/respostas";
import { permissoesQuery } from "@/lib/permissoes";
import { AppShell } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Field } from "@/components/field";
import { useConfirm } from "@/components/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** `?editar=<id>` opens the form with that answer loaded; `?q=` keeps the search term to return to. */
export const gerirSearch = (s: Record<string, unknown>): { editar?: string; q?: string } => {
  const id = typeof s["editar"] === "string" ? s["editar"] : "";
  const q = typeof s["q"] === "string" ? s["q"] : "";
  return { ...(id ? { editar: id } : {}), ...(q ? { q } : {}) };
};

export const Route = createFileRoute("/_authenticated/gerir")({
  validateSearch: gerirSearch,
  head: () => ({
    meta: [
      { title: "Editar respostas · Suporte RAL+" },
      {
        name: "description",
        content: "Adicione ou altere temas de ticket e as respetivas respostas.",
      },
      { property: "og:title", content: "Editar respostas · Suporte RAL+" },
      {
        property: "og:description",
        content: "Adicione ou altere temas de ticket e as respetivas respostas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Gerir,
});

const empty = {
  title: "",
  keywords: "",
  note: "",
  text: "Bom dia,\n\n\n\nCumprimentos,\n\nA Equipa de Suporte RAL+",
};

function Gerir() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const { editar, q } = Route.useSearch();
  const { data = [] } = useQuery(customQuery);
  const { data: perms } = useQuery(permissoesQuery);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const loaded = useRef<string | null>(null);

  // Arriving from a search result with ?editar=<id> loads that answer into the form.
  useEffect(() => {
    if (!editar || loaded.current === editar) return;
    const row = data.find((r) => r.uuid === editar);
    if (!row) return;
    loaded.current = editar;
    setEditing(row.uuid);
    setForm({ title: row.title, keywords: row.keywords, note: row.note, text: row.text });
    setMsg("");
    window.scrollTo(0, 0);
  }, [editar, data]);

  const clearParam = () => {
    if (editar) navigate({ to: "/gerir", search: {}, replace: true });
  };

  /** Returns to the search screen, restoring the term the person had typed. */
  const backToSearch = () => navigate({ to: "/", search: q ? { q } : {}, replace: true });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = {
      title: form.title.trim(),
      keywords: form.keywords.trim(),
      note: form.note.trim(),
      text: form.text.trim(),
    };
    const { error } = editing
      ? await supabase.from("respostas").update(row).eq("id", editing)
      : await supabase.from("respostas").insert(row);
    if (error) return setMsg("Não foi possível guardar: " + error.message);
    qc.invalidateQueries({ queryKey: ["respostas"] });
    setEditing(null);
    setForm(empty);
    loaded.current = null;
    // Adding and editing both go straight back to the search it came from.
    backToSearch();
  };

  const remove = async (uuid: string, title: string) => {
    const ok = await confirm({
      title: "Apagar esta resposta?",
      description: `Vai apagar a resposta «${title}». Esta ação não pode ser anulada.`,
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
    await supabase.from("respostas").delete().eq("id", uuid);
    if (editing === uuid) {
      setEditing(null);
      setForm(empty);
      loaded.current = null;
    }
    qc.invalidateQueries({ queryKey: ["respostas"] });
    backToSearch();
  };

  const startEdit = (r: {
    uuid: string;
    title: string;
    keywords: string;
    note: string;
    text: string;
  }) => {
    setEditing(r.uuid);
    loaded.current = r.uuid;
    setForm({ title: r.title, keywords: r.keywords, note: r.note, text: r.text });
    setMsg("");
    window.scrollTo(0, 0);
  };

  const cancel = () => {
    setEditing(null);
    setForm(empty);
    loaded.current = null;
    setMsg("");
    clearParam();
  };

  const signOut = async () => {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!perms) return null;
  if (!(editar ? perms.edit : perms.create))
    return (
      <AppShell perms={perms} searchTerm={q} onSignOut={signOut}>
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 space-y-4 lg:col-span-8 lg:col-start-3">
            <Alert variant="warning">
              Não tem permissão para {editar ? "alterar" : "criar"} respostas.
            </Alert>
            <p>
              <Link to="/" search={q ? { q } : {}} className="link">
                Voltar à pesquisa
              </Link>
            </p>
          </div>
        </div>
      </AppShell>
    );

  return (
    <AppShell perms={perms} searchTerm={q} onSignOut={signOut}>
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <Breadcrumbs>
            <li>
              <Link to="/" search={q ? { q } : {}} className="link">
                Pesquisa
              </Link>
            </li>
            <li>
              <span aria-current="page">{editing ? "Editar resposta" : "Adicionar resposta"}</span>
            </li>
          </Breadcrumbs>

          <h1>{editing ? "Editar resposta" : "Adicionar resposta"}</h1>
          {editing && (
            <Alert variant="info" className="mt-4">
              Está a alterar uma resposta existente.
            </Alert>
          )}
          {msg && (
            <Alert variant="destructive" className="mt-4">
              {msg}
            </Alert>
          )}

          <form onSubmit={save} className="mt-6 space-y-6">
            <Field label="Tema do ticket">
              {(control) => (
                <Input
                  {...control}
                  required
                  placeholder="Ex.: Pagamento não aparece na plataforma"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              )}
            </Field>
            <Field label="Palavras para pesquisa" optional>
              {(control) => (
                <Input
                  {...control}
                  placeholder="Ex.: pagamento referência multibanco"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              )}
            </Field>
            <Field label="Quando usar" optional>
              {(control) => (
                <Input
                  {...control}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              )}
            </Field>
            <Field label="Resposta a dar">
              {(control) => (
                <Textarea
                  {...control}
                  required
                  rows={10}
                  className="font-sans"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                />
              )}
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">{editing ? "Guardar alterações" : "Adicionar"}</Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={cancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          <section aria-labelledby="adicionadas" className="mt-12 space-y-4">
            <h2 id="adicionadas">Respostas adicionadas ({data.length})</h2>
            {data.length === 0 ? (
              <Alert variant="info">Ainda não há respostas adicionadas.</Alert>
            ) : (
              <Table containerLabel="Respostas adicionadas">
                <TableCaption className="sr-only">
                  Respostas adicionadas e ações disponíveis para cada uma
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tema</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => (
                    <TableRow key={r.uuid}>
                      <TableCell className="font-semibold">{r.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            aria-label={`Editar ${r.title}`}
                            onClick={() => startEdit(r)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            aria-label={`Apagar ${r.title}`}
                            onClick={() => remove(r.uuid, r.title)}
                          >
                            Apagar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      </div>
      {dialog}
    </AppShell>
  );
}
