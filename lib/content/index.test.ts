import { describe, expect, it } from "vitest";

import { formatCount, summarizeText } from "@/lib/content";

describe("content helpers", () => {
  it("summarizes whitespace and truncates with an ellipsis", () => {
    expect(summarizeText("  a \n  b  ")).toBe("a b");
    expect(summarizeText("abcdef", 4)).toBe("abc…");
  });

  it("pluralizes a formatted count", () => {
    expect(formatCount(1, "product")).toBe("1 product");
    expect(formatCount(1200, "product")).toBe("1,200 products");
  });
});
