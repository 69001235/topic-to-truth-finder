import { describe, it, expect } from "vitest";
import { searchTemplates } from "@/lib/search";

describe("searchTemplates", () => {
  it("finds attachments reply for 'excel'", () => {
    expect(searchTemplates("excel")[0].id).toBe("4");
  });
  it("ignores accents", () => {
    expect(searchTemplates("fatura bloqueada")[0].id).toBe("5");
  });
  it("finds lawyer reply for 'advogado'", () => {
    expect(searchTemplates("advogado nao consegue entrar")[0].id).toBe("2.1");
  });
});
