import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Drafts a reply to a ticket using only the replies stored in `respostas`. */
export const construirResposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ticket: string }) => {
    const ticket = String(input?.ticket ?? "").trim();
    if (!ticket || ticket.length > 20000) throw new Error("Texto do ticket inválido");
    return { ticket };
  })
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("tem_permissao", { _perm: "search" });
    if (!ok) throw new Error("Sem permissão para pesquisar.");
    const { data: rows, error } = await context.supabase
      .from("respostas")
      .select("ref, category, title, note, text");
    if (error) throw new Error(error.message);
    const manual = (rows ?? [])
      .map((r) => `### [${r.ref}] ${r.title} (${r.category})\nQuando usar: ${r.note}\n${r.text}`)
      .join("\n\n");

    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "És um assistente da Equipa de Suporte RAL+. Escreve em português de Portugal a resposta a enviar ao utilizador que abriu o ticket, usando APENAS a informação das respostas standard fornecidas. Mantém o tom, a saudação inicial e a assinatura das respostas standard. Não inventes procedimentos, contactos ou prazos. Se a informação não for suficiente, escreve a resposta possível e acrescenta no fim uma linha começada por 'NOTA INTERNA:' a indicar o que falta. Na primeira linha escreve 'Baseado em:' seguido das referências usadas (ex.: 1.1, 4.1), depois uma linha em branco e a resposta.",
        input: `RESPOSTAS STANDARD:\n\n${manual}\n\n---\nCORPO DO TICKET:\n${data.ticket}`,
      });
      const out = (res as { output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }).output ?? [];
      const text = out
        .filter((o) => o.type === "message")
        .flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("")
        .trim();
      if (!text) throw new Error("A IA não devolveu resposta.");
      return { text };
    } catch (e) {
      if (e instanceof GatewayError) {
        if (e.httpStatus === 429) throw new Error("Demasiados pedidos. Tente daqui a pouco.");
        if (e.httpStatus === 402) throw new Error("Créditos de IA esgotados.");
        throw new Error("Não foi possível construir a resposta. Tente novamente.");
      }
      throw e;
    }
  });
