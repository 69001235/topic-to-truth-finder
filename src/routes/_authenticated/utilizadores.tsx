import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { permissoesQuery } from "@/lib/permissoes";

export const Route = createFileRoute("/_authenticated/utilizadores")({
  head: () => ({
    meta: [
      { title: "Utilizadores · Suporte RAL+" },
      { name: "description", content: "Gerir quem tem acesso às respostas do Suporte RAL+ e o que pode fazer." },
      { property: "og:title", content: "Utilizadores · Suporte RAL+" },
      { property: "og:description", content: "Gerir quem tem acesso às respostas do Suporte RAL+ e o que pode fazer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Utilizadores,
});

const cols = [
  ["can_search", "Pesquisar"],
  ["can_create", "Criar"],
  ["can_edit", "Alterar"],
  ["can_delete", "Apagar"],
  ["is_admin", "Administrador"],
] as const;
type Col = (typeof cols)[number][0];

function Utilizadores() {
  const qc = useQueryClient();
  const { data: me } = useQuery(permissoesQuery);
  const { data: rows = [] } = useQuery({
    queryKey: ["utilizadores"],
    enabled: !!me?.admin,
    queryFn: async () => {
      const { data, error } = await supabase.from("utilizadores").select("*").order("email");
      if (error) throw error;
      return data;
    },
  });
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["utilizadores"] });
    qc.invalidateQueries({ queryKey: ["permissoes"] });
  };

  if (!me) return null;
  if (!me.admin)
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p>Só os administradores podem gerir utilizadores.</p>
        <Link to="/" className="mt-4 inline-block underline">Voltar à pesquisa</Link>
      </main>
    );

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!v.includes("@")) return setMsg("Email inválido.");
    const { error } = await supabase.from("utilizadores").insert({ email: v });
    if (error) return setMsg(error.code === "23505" ? "Esse email já está na lista." : "Erro: " + error.message);
    setEmail("");
    setMsg("");
    refresh();
  };
  const toggle = async (row: { email: string } & Record<Col, boolean>, c: Col) => {
    if (row.email === me.email && c === "is_admin") return setMsg("Não pode retirar a si próprio o papel de administrador.");
    await supabase.from("utilizadores").update({ [c]: !row[c] } as Partial<Record<Col, boolean>>).eq("email", row.email);
    refresh();
  };
  const remove = async (e: string) => {
    if (e === me.email) return setMsg("Não pode remover a sua própria conta.");
    if (!confirm(`Retirar o acesso a ${e}?`)) return;
    await supabase.from("utilizadores").delete().eq("email", e);
    refresh();
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Utilizadores</h1>
        <Link to="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">← Pesquisa</Link>
      </div>
      <p className="mt-1 text-muted-foreground">
        Só os emails desta lista conseguem usar a aplicação. A pessoa entra com Google ou cria conta com o mesmo email.
      </p>
      <form onSubmit={add} className="mt-6 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@exemplo.pt"
          className="flex-1 rounded-lg border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground hover:bg-primary/90">
          Autorizar
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted text-left">
            <tr>
              <th className="p-3">Email</th>
              {cols.map(([, l]) => <th key={l} className="p-3 text-center">{l}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email} className="border-b last:border-0">
                <td className="p-3">{r.email}</td>
                {cols.map(([c, l]) => (
                  <td key={c} className="p-3 text-center">
                    <input type="checkbox" aria-label={`${l} ${r.email}`} checked={r[c]} onChange={() => toggle(r, c)} className="h-4 w-4 accent-primary" />
                  </td>
                ))}
                <td className="p-3 text-right">
                  <button onClick={() => remove(r.email)} className="text-destructive hover:underline">Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">O administrador tem sempre todas as permissões.</p>
    </main>
  );
}
