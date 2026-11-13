import { describe, expect, it } from "vitest";

import {
  DEFAULT_SECTION,
  SECTION_MAX,
  listSections,
  normalizeSectionName,
  resolveSectionName,
  validateSectionName,
} from "@/lib/seccoes";

describe("section names", () => {
  it("collapses spaces and trims", () => {
    expect(normalizeSectionName("  Acesso   à  plataforma ")).toBe("Acesso à plataforma");
  });

  it("rejects empty and over-long names", () => {
    expect(validateSectionName("   ")).toMatch(/Indique/);
    expect(validateSectionName("x".repeat(SECTION_MAX + 1))).toMatch(/mais de 80/);
    expect(validateSectionName("x".repeat(SECTION_MAX))).toBeNull();
    expect(validateSectionName("Faturas")).toBeNull();
  });

  it("reuses an existing section that only differs in case, accents or spacing", () => {
    const existing = ["Acesso à plataforma", DEFAULT_SECTION];
    expect(resolveSectionName("acesso a  plataforma", existing)).toBe("Acesso à plataforma");
    expect(resolveSectionName("ADICIONADAS PELA EQUIPA", existing)).toBe(DEFAULT_SECTION);
  });

  it("keeps a genuinely new name as typed, with spaces tidied", () => {
    expect(resolveSectionName("  Pagamentos   RAL ", ["Acesso à plataforma"])).toBe(
      "Pagamentos RAL",
    );
  });
});

describe("listSections", () => {
  it("counts answers and orders sections by their first answer's reference", () => {
    const rows = [
      { id: "+", category: DEFAULT_SECTION },
      { id: "2.1", category: "Acesso" },
      { id: "1.2", category: "Gerais" },
      { id: "1.10", category: "Gerais" },
      { id: "1.1", category: "Gerais" },
      { id: "2.2", category: "Acesso" },
      { id: "+", category: DEFAULT_SECTION },
    ];
    expect(listSections(rows)).toEqual([
      { name: "Gerais", count: 3 },
      { name: "Acesso", count: 2 },
      { name: DEFAULT_SECTION, count: 2 },
    ]);
  });

  it("returns nothing when there are no answers", () => {
    expect(listSections([])).toEqual([]);
  });

  it("follows a moved answer to its new section", () => {
    const before = [
      { id: "1.1", category: "Gerais" },
      { id: "2.1", category: "Acesso" },
    ];
    const after = before.map((r) => (r.id === "2.1" ? { ...r, category: "Gerais" } : r));
    expect(listSections(after)).toEqual([{ name: "Gerais", count: 2 }]);
  });
});
