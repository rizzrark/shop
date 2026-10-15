import { describe, expect, it } from "vitest";

import { shopifyImageSrcSet, shopifyImageUrl } from "@/lib/media";

const SRC = "https://cdn.shopify.com/s/files/1/0000/0001/files/hat.jpg?v=123";

describe("shopify image sources", () => {
  it("adds the Shopify CDN width and keeps the existing query", () => {
    const url = new URL(shopifyImageUrl(SRC, 1320));
    expect(url.searchParams.get("width")).toBe("1320");
    expect(url.searchParams.get("v")).toBe("123");
  });

  it("builds a srcset at the two storefront widths", () => {
    expect(shopifyImageSrcSet(SRC)).toBe(
      `${shopifyImageUrl(SRC, 1320)} 1320w, ${shopifyImageUrl(SRC, 1920)} 1920w`,
    );
  });

  it("leaves non-Shopify and relative sources untouched", () => {
    expect(shopifyImageUrl("/og-default.png", 1320)).toBe("/og-default.png");
    expect(shopifyImageSrcSet("/og-default.png")).toBeUndefined();
    expect(shopifyImageSrcSet("https://example.com/hat.jpg")).toBeUndefined();
  });
});
