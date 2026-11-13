import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { customQuery } from "@/lib/respostas";
import { permissoesQuery } from "@/lib/permissoes";
import {
  DEFAULT_SECTION,
  SECTION_MAX,
  listSections,
  resolveSectionName,
  validateSectionName,
} from "@/lib/seccoes";
import { AppShell } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Field } from "@/components/field";
import { useConfirm } from "@/components/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
  category: DEFAULT_SECTION,
};

/** Value of the "Nova secção…" option; no real section can have this name. */
const NEW_SECTION = "__nova_seccao__";

type Row = {
  uuid: string;
  title: string;
  keywords: string;
  note: string;
  text: string;
  category: string;
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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [renameError, setRenameError] = useState("");
  const [msg, setMsg] = useState("");
  const [info, setInfo] = useState("");
  const loaded = useRef<string | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);

  const sections = listSections(data);
  const names = sections.map((s) => s.name);
  const formSections = Array.from(new Set([...names, DEFAULT_SECTION, form.category]));
  const canMove = !!perms?.edit;

  // Focus the name field as soon as "Nova secção…" is chosen.
  useEffect(() => {
    if (creating) newNameRef.current?.focus();
  }, [creating]);

  const loadForm = (r: Row) => {
    setEditing(r.uuid);
    loaded.current = r.uuid;
    setForm({
      title: r.title,
      keywords: r.keywords,
      note: r.note,
      text: r.text,
      category: r.category,
    });
    setCreating(false);
    setNewName("");
    setNameError("");
    setMsg("");
    setInfo("");
  };

  const resetForm = () => {
    setEditing(null);
    setForm(empty);
    setCreating(false);
    setNewName("");
    setNameError("");
    loaded.current = null;
  };

  // Arriving from a search result with ?editar=<id> loads that answer into the form.
  useEffect(() => {
    if (!editar || loaded.current === editar) return;
    const row = data.find((r) => r.uuid === editar);
    if (!row) return;
    loadForm(row);
    window.scrollTo(0, 0);
  }, [editar, data]);

  const clearParam = () => {
    if (editar) navigate({ to: "/gerir", search: {}, replace: true });
  };

  /** Returns to the search screen, restoring the term the person had typed. */
  const backToSearch = () => navigate({ to: "/", search: q ? { q } : {}, replace: true });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let category = form.category;
    if (creating) {
      const problem = validateSectionName(newName);
      if (problem) {
        setNameError(problem);
        newNameRef.current?.focus();
        return;
      }
      category = resolveSectionName(newName, names);
    }
    const row = {
      title: form.title.trim(),
      keywords: form.keywords.trim(),
      note: form.note.trim(),
      text: form.text.trim(),
      category,
    };
    const { error } = editing
      ? await supabase.from("respostas").update(row).eq("id", editing)
      : await supabase.from("respostas").insert(row);
    if (error) return setMsg("Não foi possível guardar: " + error.message);
    qc.invalidateQueries({ queryKey: ["respostas"] });
    resetForm();
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
    if (editing === uuid) resetForm();
    qc.invalidateQueries({ queryKey: ["respostas"] });
    backToSearch();
  };

  const startEdit = (r: Row) => {
    loadForm(r);
    window.scrollTo(0, 0);
  };

  const cancel = () => {
    resetForm();
    setMsg("");
    clearParam();
  };

  /** Moves one answer to another section straight away (needs permission to edit). */
  const move = async (r: Row, category: string) => {
    if (category === r.category) return;
    setMsg("");
    setInfo("");
    const { data: changed, error } = await supabase
      .from("respostas")
      .update({ category })
      .eq("id", r.uuid)
      .select("id");
    if (error || !changed?.length)
      return setMsg(
        error
          ? "Não foi possível mover a resposta: " + error.message
          : "Não foi possível mover a resposta. Confirme que tem permissão para alterar respostas.",
      );
    // Keep an open edit form in step so saving it does not move the answer back.
    if (editing === r.uuid) setForm((f) => ({ ...f, category }));
    await qc.invalidateQueries({ queryKey: ["respostas"] });
    setInfo(`A resposta «${r.title}» foi movida para a secção «${category}».`);
  };

  /** Chooses "Nova secção…" for an answer: opens it in the form with the name field ready. */
  const startNewSection = (r: Row) => {
    loadForm(r);
    setCreating(true);
    window.scrollTo(0, 0);
  };

  const renameSection = async () => {
    if (!renaming) return;
    const problem = validateSectionName(renaming.to);
    if (problem) return setRenameError(problem);
    const to = resolveSectionName(
      renaming.to,
      names.filter((n) => n !== renaming.from),
    );
    if (to === renaming.from) return setRenaming(null);
    if (names.includes(to)) {
      const ok = await confirm({
        title: "Juntar secções?",
        description: `Já existe a secção «${to}». As respostas de «${renaming.from}» vão passar para ela.`,
        confirmLabel: "Juntar",
      });
      if (!ok) return;
    }
    setMsg("");
    setInfo("");
    const { data: changed, error } = await supabase
      .from("respostas")
      .update({ category: to })
      .eq("category", renaming.from)
      .select("id");
    if (error || !changed?.length)
      return setRenameError(
        error
          ? "Não foi possível renomear: " + error.message
          : "Não foi possível renomear. Confirme que tem permissão para alterar respostas.",
      );
    if (form.category === renaming.from) setForm((f) => ({ ...f, category: to }));
    await qc.invalidateQueries({ queryKey: ["respostas"] });
    setInfo(`A secção «${renaming.from}» passou a «${to}».`);
    setRenaming(null);
    setRenameError("");
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
          {info && (
            <Alert variant="success" className="mt-4">
              {info}
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
            <Field label="Secção" hint="Agrupa a resposta na pesquisa.">
              {(control) => (
                <NativeSelect
                  {...control}
                  value={creating ? NEW_SECTION : form.category}
                  onChange={(e) => {
                    if (e.target.value === NEW_SECTION) {
                      setCreating(true);
                      return;
                    }
                    setCreating(false);
                    setNameError("");
                    setForm({ ...form, category: e.target.value });
                  }}
                >
                  {formSections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value={NEW_SECTION}>Nova secção…</option>
                </NativeSelect>
              )}
            </Field>
            {creating && (
              <Field
                label="Nome da nova secção"
                hint={`Até ${SECTION_MAX} caracteres. A secção fica criada quando guardar a resposta.`}
                error={nameError}
              >
                {(control) => (
                  <Input
                    {...control}
                    ref={newNameRef}
                    maxLength={SECTION_MAX}
                    placeholder="Ex.: Pagamentos"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setNameError("");
                    }}
                  />
                )}
              </Field>
            )}
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

          {canMove && sections.length > 0 && (
            <section aria-labelledby="seccoes" className="mt-12 space-y-4">
              <h2 id="seccoes">Secções ({sections.length})</h2>
              <p className="text-muted-foreground">
                Para criar uma secção, escolha «Nova secção…» no campo Secção. Para mover uma
                resposta, use o campo Secção na tabela de respostas.
              </p>
              <Table containerLabel="Secções">
                <TableCaption className="sr-only">
                  Secções, número de respostas em cada uma e ações disponíveis
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secção</TableHead>
                    <TableHead className="text-right">Respostas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((s) => {
                    const isRenaming = renaming?.from === s.name;
                    return (
                      <TableRow key={s.name}>
                        <TableCell className="font-semibold">
                          {isRenaming ? (
                            <div className="space-y-1">
                              <Input
                                autoFocus
                                aria-label={`Novo nome da secção ${s.name}`}
                                aria-invalid={renameError ? true : undefined}
                                aria-describedby={renameError ? "erro-renomear" : undefined}
                                maxLength={SECTION_MAX}
                                value={renaming.to}
                                onChange={(e) => {
                                  setRenaming({ from: s.name, to: e.target.value });
                                  setRenameError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    void renameSection();
                                  }
                                  if (e.key === "Escape") {
                                    setRenaming(null);
                                    setRenameError("");
                                  }
                                }}
                              />
                              {renameError && (
                                <p id="erro-renomear" className="font-semibold text-destructive">
                                  <span className="sr-only">Erro: </span>
                                  {renameError}
                                </p>
                              )}
                            </div>
                          ) : (
                            s.name
                          )}
                        </TableCell>
                        <TableCell className="text-right">{s.count}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            {isRenaming ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void renameSection()}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setRenaming(null);
                                    setRenameError("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                aria-label={`Renomear a secção ${s.name}`}
                                onClick={() => {
                                  setRenaming({ from: s.name, to: s.name });
                                  setRenameError("");
                                }}
                              >
                                Renomear
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </section>
          )}

          <section aria-labelledby="adicionadas" className="mt-12 space-y-4">
            <h2 id="adicionadas">Respostas adicionadas ({data.length})</h2>
            {data.length === 0 ? (
              <Alert variant="info">Ainda não há respostas adicionadas.</Alert>
            ) : (
              <Table containerLabel="Respostas adicionadas">
                <TableCaption className="sr-only">
                  Respostas adicionadas, a secção de cada uma e ações disponíveis
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tema</TableHead>
                    <TableHead>Secção</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => (
                    <TableRow key={r.uuid}>
                      <TableCell className="font-semibold">{r.title}</TableCell>
                      <TableCell className="min-w-56">
                        {canMove ? (
                          <NativeSelect
                            aria-label={`Secção da resposta ${r.title}`}
                            value={r.category}
                            onChange={(e) =>
                              e.target.value === NEW_SECTION
                                ? startNewSection(r)
                                : void move(r, e.target.value)
                            }
                          >
                            {names.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                            <option value={NEW_SECTION}>Nova secção…</option>
                          </NativeSelect>
                        ) : (
                          r.category
                        )}
                      </TableCell>
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
