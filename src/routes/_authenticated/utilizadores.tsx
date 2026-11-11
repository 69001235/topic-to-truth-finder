import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { permissoesQuery } from "@/lib/permissoes";
import { useServerFn } from "@tanstack/react-start";
import { autorizarEConvidar } from "@/lib/utilizadores.functions";
import { AppShell } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Field } from "@/components/field";
import { useConfirm } from "@/components/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, LoaderCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/utilizadores")({
  head: () => ({
    meta: [
      { title: "Utilizadores · Suporte RAL+" },
      {
        name: "description",
        content: "Gerir quem tem acesso às respostas do Suporte RAL+ e o que pode fazer.",
      },
      { property: "og:title", content: "Utilizadores · Suporte RAL+" },
      {
        property: "og:description",
        content: "Gerir quem tem acesso às respostas do Suporte RAL+ e o que pode fazer.",
      },
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
type Tone = "success" | "warning" | "destructive";

function Utilizadores() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
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
  const [tone, setTone] = useState<Tone>("success");
  const [busy, setBusy] = useState("");
  const invite = useServerFn(autorizarEConvidar);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["utilizadores"] });
    qc.invalidateQueries({ queryKey: ["permissoes"] });
  };
  const notify = (text: string, kind: Tone) => {
    setMsg(text);
    setTone(kind);
  };
  const signOut = async () => {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!me) return null;
  if (!me.admin)
    return (
      <AppShell perms={me} onSignOut={signOut}>
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 space-y-4 lg:col-span-8 lg:col-start-3">
            <Alert variant="warning">Só os administradores podem gerir utilizadores.</Alert>
            <p>
              <Link to="/" className="link">
                Voltar à pesquisa
              </Link>
            </p>
          </div>
        </div>
      </AppShell>
    );

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!v.includes("@")) return notify("Email inválido.", "destructive");
    await sendInvite(v, false);
  };
  const sendInvite = async (email: string, reenviar: boolean) => {
    if (busy) return;
    setBusy(email);
    setMsg("");
    try {
      const result = await invite({ data: { email, reenviar } });
      notify(result.message, result.status === "failed" ? "destructive" : "success");
      if (!reenviar) setEmail("");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Não foi possível autorizar e enviar o convite.",
        "destructive",
      );
    } finally {
      refresh();
      setBusy("");
    }
  };
  const toggle = async (row: { email: string } & Record<Col, boolean>, c: Col) => {
    if (row.email === me.email && c === "is_admin")
      return notify("Não pode retirar a si próprio o papel de administrador.", "warning");
    await supabase
      .from("utilizadores")
      .update({ [c]: !row[c] } as Partial<Record<Col, boolean>>)
      .eq("email", row.email);
    refresh();
  };
  const remove = async (e: string) => {
    if (e === me.email) return notify("Não pode remover a sua própria conta.", "warning");
    const ok = await confirm({
      title: "Retirar o acesso?",
      description: `Vai retirar o acesso a ${e}. Pode autorizar este email de novo mais tarde.`,
      confirmLabel: "Retirar acesso",
      destructive: true,
    });
    if (!ok) return;
    await supabase.from("utilizadores").delete().eq("email", e);
    refresh();
  };

  return (
    <AppShell perms={me} onSignOut={signOut}>
      <div className="grid grid-cols-12 gap-x-6 gap-y-6">
        <div className="col-span-12 lg:col-span-10 lg:col-start-2">
          <Breadcrumbs>
            <li>
              <Link to="/" className="link">
                Pesquisa
              </Link>
            </li>
            <li>
              <span aria-current="page">Utilizadores</span>
            </li>
          </Breadcrumbs>
          <h1>Utilizadores</h1>
          <p className="mt-2 text-muted-foreground">
            Só os emails desta lista têm acesso à aplicação.
          </p>
        </div>

        <form onSubmit={add} className="col-span-12 space-y-4 lg:col-span-6 lg:col-start-2">
          <Field label="Email a autorizar" hint="Autoriza o acesso e envia um convite por email.">
            {(control) => (
              <Input
                {...control}
                type="email"
                required
                disabled={!!busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.pt"
              />
            )}
          </Field>
          <Button type="submit" disabled={!!busy}>
            {busy ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Mail aria-hidden="true" />
            )}
            {busy ? "A enviar…" : "Autorizar e convidar"}
          </Button>
        </form>

        {msg && (
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <Alert variant={tone}>{msg}</Alert>
          </div>
        )}

        <section
          aria-labelledby="lista-utilizadores"
          className="col-span-12 space-y-3 lg:col-span-10 lg:col-start-2"
        >
          <h2 id="lista-utilizadores">Utilizadores autorizados ({rows.length})</h2>
          <Table containerLabel="Utilizadores e permissões">
            <TableCaption className="sr-only">
              Utilizadores com acesso à aplicação e respetivas permissões
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                {cols.map(([, l]) => (
                  <TableHead key={l} className="text-center">
                    {l}
                  </TableHead>
                ))}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.email}>
                  <TableCell>{r.email}</TableCell>
                  {cols.map(([c, l]) => (
                    <TableCell key={c} className="text-center">
                      <input
                        type="checkbox"
                        aria-label={`${l} ${r.email}`}
                        checked={r[c]}
                        onChange={() => toggle(r, c)}
                        className="size-6 accent-primary"
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        title="Enviar convite"
                        aria-label={`Enviar convite a ${r.email}`}
                        disabled={!!busy}
                        onClick={() => sendInvite(r.email, true)}
                      >
                        {busy === r.email ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="animate-spin motion-reduce:animate-none"
                          />
                        ) : (
                          <Mail aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        aria-label={`Remover ${r.email}`}
                        onClick={() => remove(r.email)}
                      >
                        Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-muted-foreground">O administrador tem sempre todas as permissões.</p>
        </section>
      </div>
      {dialog}
    </AppShell>
  );
}
