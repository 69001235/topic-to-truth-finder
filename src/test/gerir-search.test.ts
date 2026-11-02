import { describe, expect, it } from "vitest";

import { gerirSearch } from "@/routes/_authenticated/gerir";

describe("gerir search params", () => {
  it("keeps the answer id so the form opens in edit mode", () => {
    expect(gerirSearch({ editar: "0b0e-uuid" })).toEqual({ editar: "0b0e-uuid" });
  });

  it("keeps the typed term so saving or deleting can return to the same search", () => {
    expect(gerirSearch({ editar: "0b0e-uuid", q: "fatura bloqueada" })).toEqual({
      editar: "0b0e-uuid",
      q: "fatura bloqueada",
    });
  });

  it("ignores a missing or non-text id and stays in add mode", () => {
    expect(gerirSearch({})).toEqual({});
    expect(gerirSearch({ editar: "" })).toEqual({});
    expect(gerirSearch({ editar: 12 })).toEqual({});
    expect(gerirSearch({ q: "" })).toEqual({});
    expect(gerirSearch({ q: 7 })).toEqual({});
  });
});
