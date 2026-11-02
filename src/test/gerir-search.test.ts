import { describe, expect, it } from "vitest";

import { gerirSearch } from "@/routes/_authenticated/gerir";

describe("gerir search params", () => {
  it("keeps the answer id so the form opens in edit mode", () => {
    expect(gerirSearch({ editar: "0b0e-uuid" })).toEqual({ editar: "0b0e-uuid" });
  });

  it("ignores a missing or non-text id and stays in add mode", () => {
    expect(gerirSearch({})).toEqual({ editar: undefined });
    expect(gerirSearch({ editar: "" })).toEqual({ editar: undefined });
    expect(gerirSearch({ editar: 12 })).toEqual({ editar: undefined });
  });
});
