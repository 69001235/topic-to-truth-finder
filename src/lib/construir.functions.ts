import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { searchTemplates } from "@/lib/search";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
/** Groq's free tier allows 8K tokens per minute for this model; keep the manual small. */
const MAX_MANUAL_CHARS = 12000;
const MAX_ANSWERS = 10;

async function readGroqError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return (body?.error?.message ?? "").slice(0, 300);
  } catch {
    return "";
  }
}

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
      .select("ref, category, title, keywords, note, text");
    if (error) throw new Error(error.message);

    const answers = (rows ?? []).map((r) => ({
      id: r.ref,
      title: r.title,
      category: r.category,
      keywords: r.keywords ?? "",
      note: r.note ?? "",
      text: r.text,
    }));

    // Sending every standard reply can exceed the model's per-minute token
    // limit, so send only the answers that best match the ticket. If nothing
    // matches, fall back to all of them (still capped below).
    const matched = searchTemplates(data.ticket, answers);
    const chosen = (matched.length ? matched : answers).slice(0, MAX_ANSWERS);
    let manual = "";
    for (const r of chosen) {
      const entry = `### [${r.id}] ${r.title} (${r.category})\nQuando usar: ${r.note}\n${r.text}`;
      if (manual && manual.length + entry.length + 2 > MAX_MANUAL_CHARS) break;
      manual = manual ? `${manual}\n\n${entry}` : entry;
    }

    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) throw new Error("GROQ_API_KEY não configurada.");

    const model = process.env["GROQ_MODEL"] || DEFAULT_GROQ_MODEL;
    const instructions =
      "És um assistente da Equipa de Suporte RAL+. Escreve em português de Portugal a resposta a enviar ao utilizador que abriu o ticket, usando APENAS a informação das respostas standard fornecidas. Mantém o tom, a saudação inicial e a assinatura das respostas standard. Não inventes procedimentos, contactos ou prazos. Se a informação não for suficiente, escreve a resposta possível e acrescenta no fim uma linha começada por 'NOTA INTERNA:' a indicar o que falta. Na primeira linha escreve 'Baseado em:' seguido das referências usadas (ex.: 1.1, 4.1), depois uma linha em branco e a resposta.";

    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: instructions },
            {
              role: "user",
              content: `RESPOSTAS STANDARD:\n\n${manual}\n\n---\nCORPO DO TICKET:\n${data.ticket}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await readGroqError(res);
        console.error(`[Groq] HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
        if (res.status === 429) {
          const wait =
            res.headers.get("retry-after") ?? res.headers.get("x-ratelimit-reset-tokens");
          throw new Error(
            `Limite de pedidos da Groq atingido${wait ? ` (repõe em ${wait})` : ""}. Tente novamente.`,
          );
        }
        if (res.status === 401) throw new Error("Chave da API Groq inválida.");
        if (res.status === 402) throw new Error("Créditos de IA esgotados.");
        if (res.status === 404) throw new Error(`Modelo Groq não encontrado ("${model}").`);
        throw new Error(
          `Não foi possível construir a resposta (Groq ${res.status})${detail ? `: ${detail}` : ""}.`,
        );
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = (json?.choices?.[0]?.message?.content ?? "").trim();
      if (!text) throw new Error("A IA não devolveu resposta.");
      return { text };
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error("Não foi possível construir a resposta. Tente novamente.");
    }
  });
