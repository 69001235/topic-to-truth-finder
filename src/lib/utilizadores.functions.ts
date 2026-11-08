import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const autorizarEConvidar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    reenviar: z.boolean().default(false),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error: permissionError } = await context.supabase.rpc("tem_permissao", { _perm: "admin" });
    if (permissionError || !admin) throw new Error("Só os administradores podem autorizar e convidar utilizadores.");

    if (data.reenviar) {
      const { data: row, error } = await context.supabase.from("utilizadores").select("email").eq("email", data.email).maybeSingle();
      if (error || !row) throw new Error("Autorize primeiro este email.");
    } else {
      const { error } = await context.supabase.from("utilizadores").insert({ email: data.email });
      if (error) throw new Error(error.code === "23505" ? "Esse email já está autorizado. Use Enviar convite na respetiva linha." : "Não foi possível autorizar o email.");
    }

    // Only load privileged credentials after the authenticated database role check.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: "https://topic-to-truth-finder.lovable.app/auth/convite",
    });
    if (!error) return { status: "sent" as const, message: "Email autorizado e convite enviado." };
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return { status: "existing" as const, message: "Email autorizado. Esta pessoa já tem conta e pode entrar com os seus dados habituais." };
    }
    // Preserve the authorization and expose a retry; never claim an email was sent on failure.
    return {
      status: "failed" as const,
      message: error.status === 429
        ? "Email autorizado, mas o limite de convites foi atingido. Tente Enviar convite mais tarde."
        : "Email autorizado, mas não foi possível enviar o convite. Tente Enviar convite na respetiva linha.",
    };
  });