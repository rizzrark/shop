import { describe, expect, it } from "vitest";

import { canonicalQuickShopOptions } from "@/lib/product/quick-shop";

const options = [
  { name: "Size", values: [{ name: "Small" }, { name: "Large" }] },
  { name: "Color", values: [{ name: "Red" }, { name: "Blue" }] },
];

describe("canonicalQuickShopOptions", () => {
  it("returns canonical names and values for an exact selection", () => {
    expect(
      canonicalQuickShopOptions(options, [
        { name: "Size", value: "Large" },
        { name: "Color", value: "Blue" },
      ]),
    ).toEqual([
      { name: "Size", value: "Large" },
      { name: "Color", value: "Blue" },
    ]);
  });

  it("matches option names and values case-insensitively", () => {
    expect(
      canonicalQuickShopOptions(options, [
        { name: "size", value: "large" },
        { name: "color", value: "red" },
      ]),
    ).toEqual([
      { name: "Size", value: "Large" },
      { name: "Color", value: "Red" },
    ]);
  });

  it("rejects a selection that does not cover every option once", () => {
    expect(canonicalQuickShopOptions(options, [{ name: "Size", value: "Large" }])).toBeNull();
    expect(
      canonicalQuickShopOptions(options, [
        { name: "Size", value: "Large" },
        { name: "Size", value: "Small" },
      ]),
    ).toBeNull();
  });

  it("rejects a value the product does not sell", () => {
    expect(
      canonicalQuickShopOptions(options, [
        { name: "Size", value: "Medium" },
        { name: "Color", value: "Blue" },
      ]),
    ).toBeNull();
  });

  it("rejects a selection that is not a list of named values", () => {
    expect(canonicalQuickShopOptions(options, null as never)).toBeNull();
    expect(canonicalQuickShopOptions(options, [{ name: "Size", value: 1 }] as never)).toBeNull();
  });
});
