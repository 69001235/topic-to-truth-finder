import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Respostas Suporte RAL+" },
      { name: "description", content: "Entrada por convite para utilizadores autorizados do Suporte RAL+." },
      { property: "og:title", content: "Entrar · Respostas Suporte RAL+" },
      { property: "og:description", content: "Entrada por convite para utilizadores autorizados do Suporte RAL+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const input = "w-full rounded-lg border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

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
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return setMsg("Não foi possível entrar com Google.");
    if (r.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Link to="/" className="mb-6 text-sm text-muted-foreground hover:underline">← Voltar à pesquisa</Link>
      <h1 className="text-2xl font-bold">Entrar</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" required minLength={6} placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button disabled={busy} className="h-auto w-full py-3 font-medium">
          Entrar
        </Button>
      </form>
      <Button variant="outline" onClick={google} className="mt-3 h-auto w-full py-3 font-medium">
        Continuar com Google
      </Button>
      {msg && <p className="mt-4 text-sm text-muted-foreground">{msg}</p>}
    </main>
  );
}
