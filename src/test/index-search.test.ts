import { describe, expect, it } from "vitest";

import { indexSearch } from "@/routes/index";

describe("search page params", () => {
  it("keeps the term so returning from editing reopens the same search", () => {
    expect(indexSearch({ q: "excel" })).toEqual({ q: "excel" });
  });

  it("ignores a missing or non-text term", () => {
    expect(indexSearch({})).toEqual({});
    expect(indexSearch({ q: "" })).toEqual({});
    expect(indexSearch({ q: 3 })).toEqual({});
  });
});
