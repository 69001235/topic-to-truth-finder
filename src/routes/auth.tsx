import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Respostas Suporte RAL+" },
      { name: "description", content: "Entre para adicionar respostas ao manual do Suporte RAL+." },
      { property: "og:title", content: "Entrar · Respostas Suporte RAL+" },
      { property: "og:description", content: "Entre para adicionar respostas ao manual do Suporte RAL+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const input = "w-full rounded-lg border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Email ou palavra-passe incorretos.");
      else navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/gerir" },
      });
      setMsg(error ? error.message : "Conta criada. Confirme o seu email para entrar.");
    }
    setBusy(false);
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
      <h1 className="text-2xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" required minLength={6} placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {mode === "in" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <button onClick={google} className="mt-3 w-full rounded-lg border bg-card py-3 font-medium hover:bg-accent">
        Continuar com Google
      </button>
      {msg && <p className="mt-4 text-sm text-muted-foreground">{msg}</p>}
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-primary hover:underline">
        {mode === "in" ? "Ainda não tem conta? Criar conta" : "Já tem conta? Entrar"}
      </button>
    </main>
  );
}
