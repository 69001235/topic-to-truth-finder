import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { customQuery } from "@/lib/respostas";

/** `?editar=<id>` opens the form with that answer loaded for editing. */
export const gerirSearch = (s: Record<string, unknown>): { editar?: string } => {
  const id = typeof s["editar"] === "string" ? s["editar"] : "";
  return id ? { editar: id } : {};
};


export const Route = createFileRoute("/_authenticated/gerir")({
  validateSearch: gerirSearch,
  head: () => ({
    meta: [
      { title: "Editar respostas · Suporte RAL+" },
      { name: "description", content: "Adicione ou altere temas de ticket e as respetivas respostas." },
      { property: "og:title", content: "Editar respostas · Suporte RAL+" },
      { property: "og:description", content: "Adicione ou altere temas de ticket e as respetivas respostas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Gerir,
});

const field = "w-full rounded-lg border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring";
const empty = { title: "", keywords: "", note: "", text: "Bom dia,\n\n\n\nCumprimentos,\n\nA Equipa de Suporte RAL+" };

function Gerir() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { editar } = Route.useSearch();
  const { data = [] } = useQuery(customQuery);
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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { title: form.title.trim(), keywords: form.keywords.trim(), note: form.note.trim(), text: form.text.trim() };
    const { error } = editing
      ? await supabase.from("respostas").update(row).eq("id", editing)
      : await supabase.from("respostas").insert(row);
    if (error) return setMsg("Não foi possível guardar: " + error.message);
    setMsg(editing ? "Resposta atualizada." : "Resposta adicionada.");
    setForm(empty);
    setEditing(null);
    loaded.current = null;
    clearParam();
    qc.invalidateQueries({ queryKey: ["respostas"] });
  };

  const remove = async (uuid: string) => {
    if (!confirm("Apagar esta resposta?")) return;
    await supabase.from("respostas").delete().eq("id", uuid);
    if (editing === uuid) {
      setEditing(null);
      setForm(empty);
      loaded.current = null;
      clearParam();
    }
    qc.invalidateQueries({ queryKey: ["respostas"] });
  };

  const startEdit = (r: { uuid: string; title: string; keywords: string; note: string; text: string }) => {
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

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">← Voltar à pesquisa</Link>
        <button onClick={signOut} className="text-sm text-muted-foreground hover:underline">Sair</button>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{editing ? "Editar resposta" : "Adicionar resposta"}</h1>
      {editing && <p className="mt-1 text-sm text-muted-foreground">Está a alterar uma resposta existente.</p>}
      <form onSubmit={save} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Tema do ticket</span>
          <input required className={field + " mt-1"} placeholder="Ex.: Pagamento não aparece na plataforma" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Palavras para pesquisa <span className="text-muted-foreground">(opcional)</span></span>
          <input className={field + " mt-1"} placeholder="Ex.: pagamento referência multibanco" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Quando usar <span className="text-muted-foreground">(opcional)</span></span>
          <input className={field + " mt-1"} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Resposta a dar</span>
          <textarea required rows={10} className={field + " mt-1 font-sans"} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        </label>
        <div className="flex gap-3">
          <button className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
            {editing ? "Guardar alterações" : "Adicionar"}
          </button>
          {editing && (
            <button type="button" onClick={cancel} className="rounded-lg border px-5 py-3 hover:bg-accent">
              Cancelar
            </button>
          )}
        </div>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>

      <h2 className="mt-12 text-xl font-semibold">Respostas adicionadas ({data.length})</h2>
      <div className="mt-4 space-y-2">
        {data.map((r) => (
          <div key={r.uuid} className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <span className="flex-1 font-medium">{r.title}</span>
            <button onClick={() => startEdit(r)} className="text-sm text-primary hover:underline">Editar</button>
            <button onClick={() => remove(r.uuid)} className="text-sm text-destructive hover:underline">Apagar</button>
          </div>
        ))}
      </div>
    </main>
  );
}
