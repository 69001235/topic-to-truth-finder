import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppShell } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Field } from "@/components/field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Respostas Suporte RAL+" },
      {
        name: "description",
        content: "Entrada por convite para utilizadores autorizados do Suporte RAL+.",
      },
      { property: "og:title", content: "Entrar · Respostas Suporte RAL+" },
      {
        property: "og:description",
        content: "Entrada por convite para utilizadores autorizados do Suporte RAL+.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Email ou palavra-passe incorretos.");
      else navigate({ to: "/" });
    } catch {
      setMsg("Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) return setMsg("Não foi possível entrar com Google.");
    if (r.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4">
          <Breadcrumbs>
            <li>
              <Link to="/" className="link">
                Pesquisa
              </Link>
            </li>
            <li>
              <span aria-current="page">Entrar</span>
            </li>
          </Breadcrumbs>

          <h1>Entrar</h1>
          <p className="mt-2 text-muted-foreground">
            Entrada reservada a utilizadores autorizados.
          </p>

          {msg && (
            <Alert variant="destructive" className="mt-6">
              {msg}
            </Alert>
          )}

          <form onSubmit={submit} className="mt-6 space-y-6">
            <Field label="Email">
              {(control) => (
                <Input
                  {...control}
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
            <Field label="Palavra-passe">
              {(control) => (
                <Input
                  {...control}
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "A entrar…" : "Entrar"}
            </Button>
          </form>

          <p className="my-6 text-center text-muted-foreground">ou</p>

          <Button type="button" variant="secondary" onClick={google} className="w-full">
            Continuar com Google
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
