import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth_/convite")({
  head: () => ({
    meta: [
      { title: "Aceitar convite · Suporte RAL+" },
      {
        name: "description",
        content: "Defina a sua palavra-passe para aceder ao Suporte RAL+ por convite.",
      },
      { property: "og:title", content: "Aceitar convite · Suporte RAL+" },
      { property: "og:description", content: "Ative o seu acesso autorizado ao Suporte RAL+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AceitarConvite,
});

function AceitarConvite() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function accept() {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash");
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });
          if (error) throw error;
        }
        // getSession waits for the standard invitation fragment to be processed.
        await supabase.auth.getSession();
        const { data, error } = await supabase.auth.getUser();
        window.history.replaceState(null, "", window.location.pathname);
        if (error || !data.user) throw new Error("invalid invitation");
        if (active) setReady(true);
      } catch {
        window.history.replaceState(null, "", window.location.pathname);
        if (active)
          setMessage("O convite é inválido ou expirou. Peça ao administrador um novo convite.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void accept();
    return () => {
      active = false;
    };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) return setMessage("As palavras-passe não coincidem.");
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error)
        setMessage(
          "Não foi possível guardar a palavra-passe. Use uma palavra-passe mais forte e tente novamente.",
        );
      else await navigate({ to: "/" });
    } catch {
      setMessage("Não foi possível guardar a palavra-passe. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4">
          <h1>Aceitar convite</h1>
          {loading && (
            <p role="status" className="mt-4 text-muted-foreground">
              A validar convite…
            </p>
          )}
          {message && (
            <Alert variant="destructive" className="mt-6">
              {message}
            </Alert>
          )}
          {ready && (
            <form onSubmit={save} className="mt-6 space-y-6">
              <Field label="Nova palavra-passe" hint="Use pelo menos 8 caracteres.">
                {(control) => (
                  <Input
                    {...control}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Confirmar palavra-passe">
                {(control) => (
                  <Input
                    {...control}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                {busy ? "A guardar…" : "Guardar e entrar"}
              </Button>
            </form>
          )}
          {!loading && !ready && (
            <p className="mt-6">
              <Link to="/auth" className="link">
                Voltar à entrada
              </Link>
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
