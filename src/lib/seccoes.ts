import { normalize } from "@/lib/search";

/**
 * Sections are not a table of their own: a section is the `category` text of an
 * answer, so creating one means giving an answer a new name and moving answers
 * means changing that field. A section therefore exists only while it has answers.
 */

/** Section the database assigns to answers added without choosing one. */
export const DEFAULT_SECTION = "Adicionadas pela equipa";

export const SECTION_MAX = 80;

export type Section = { name: string; count: number };

/** Collapses repeated spaces and trims the ends. */
export const normalizeSectionName = (name: string) => name.replace(/\s+/g, " ").trim();

/** Returns an error message for an unusable section name, or null when it is fine. */
export function validateSectionName(name: string): string | null {
  const clean = normalizeSectionName(name);
  if (!clean) return "Indique o nome da secção.";
  if (clean.length > SECTION_MAX)
    return `O nome da secção não pode ter mais de ${SECTION_MAX} caracteres.`;
  return null;
}

/**
 * Reuses an existing section when the name only differs in case, accents or
 * spacing ("acesso a plataforma" → "Acesso à plataforma"), so typing a name
 * never creates a near-duplicate section.
 */
export function resolveSectionName(name: string, existing: readonly string[]): string {
  const clean = normalizeSectionName(name);
  const key = normalize(clean);
  return existing.find((s) => normalize(normalizeSectionName(s)) === key) ?? clean;
}

/** Sort key matching the search screen: manual numbers first, added answers ("+") last. */
const refKey = (ref: string) => (ref === "+" ? "999" : ref);

/**
 * Sections with their answer count, in the order the search screen shows them:
 * answers are ordered by reference and sections follow their first answer.
 */
export function listSections(rows: readonly { id: string; category: string }[]): Section[] {
  const sorted = [...rows].sort((a, b) =>
    refKey(a.id).localeCompare(refKey(b.id), undefined, { numeric: true }),
  );
  const counts = new Map<string, number>();
  for (const r of sorted) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}
