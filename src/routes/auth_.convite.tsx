import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth_/convite")({
  head: () => ({ meta: [
    { title: "Aceitar convite · Suporte RAL+" },
    { name: "description", content: "Defina a sua palavra-passe para aceder ao Suporte RAL+ por convite." },
    { property: "og:title", content: "Aceitar convite · Suporte RAL+" },
    { property: "og:description", content: "Ative o seu acesso autorizado ao Suporte RAL+." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
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
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
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
        if (active) setMessage("O convite é inválido ou expirou. Peça ao administrador um novo convite.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void accept();
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) return setMessage("As palavras-passe não coincidem.");
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage("Não foi possível guardar a palavra-passe. Use uma palavra-passe mais forte e tente novamente.");
      else await navigate({ to: "/" });
    } catch {
      setMessage("Não foi possível guardar a palavra-passe. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">Aceitar convite</h1>
      {loading && <p className="mt-4 text-muted-foreground">A validar convite…</p>}
      {ready && <form onSubmit={save} className="mt-6 space-y-3">
        <label className="block text-sm">Nova palavra-passe
          <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="block text-sm">Confirmar palavra-passe
          <input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <Button disabled={busy} className="h-auto w-full py-3">{busy ? "A guardar…" : "Guardar e entrar"}</Button>
      </form>}
      {message && <p role="alert" className="mt-4 text-sm text-destructive">{message}</p>}
      {!loading && !ready && <Link to="/auth" className="mt-4 text-sm underline">Voltar à entrada</Link>}
    </main>
  );
}