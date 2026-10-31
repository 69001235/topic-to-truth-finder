import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "@/lib/search";

export const customQuery = queryOptions({
  queryKey: ["respostas"],
  queryFn: async (): Promise<(Template & { uuid: string })[]> => {
    const { data, error } = await supabase
      .from("respostas")
      .select("id, title, keywords, note, text")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      uuid: r.id,
      id: "+",
      title: r.title,
      category: "Adicionadas pela equipa",
      keywords: r.keywords,
      note: r.note,
      text: r.text,
    }));
  },
});
