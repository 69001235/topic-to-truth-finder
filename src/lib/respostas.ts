import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "@/lib/search";

/** All answers (manual + team-added) live in the `respostas` table, so every one is editable. */
export const customQuery = queryOptions({
  queryKey: ["respostas"],
  queryFn: async (): Promise<(Template & { uuid: string })[]> => {
    const { data, error } = await supabase
      .from("respostas")
      .select("id, ref, category, title, keywords, note, text")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      uuid: r.id,
      id: r.ref,
      title: r.title,
      category: r.category,
      keywords: r.keywords,
      note: r.note,
      text: r.text,
    }));
  },
});
