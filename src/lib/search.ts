import data from "@/data/templates.json";

export type Template = (typeof data)[number];
export const templates: Template[] = data;

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Rank manual replies by how well they match the query (accent-insensitive). */
export function searchTemplates(query: string, list: Template[] = templates): Template[] {
  const words = normalize(query).split(/\W+/).filter((w) => w.length > 1);
  if (!words.length) return list;
  const scored = list.map((t) => {
    const title = normalize(t.title + " " + t.category);
    const kw = normalize(t.keywords);
    const body = normalize(t.note + " " + t.text);
    let score = 0;
    for (const w of words) {
      if (title.includes(w)) score += 5;
      if (kw.includes(w)) score += 4;
      if (body.includes(w)) score += 1;
    }
    return { t, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.t);
}
