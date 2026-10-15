import { describe, expect, it } from "vitest";

import { shopConfig } from "@/lib/config";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

describe("seo paths", () => {
  it("builds a canonical path and drops the pagination cursor", () => {
    expect(buildAlternates({ pathname: "/products/hat" })).toEqual({
      canonical: "/products/hat",
    });
    expect(
      buildAlternates({
        pathname: "/collections/summer/",
        searchParams: { cursor: "abc", sort_by: "price-ascending" },
      }),
    ).toEqual({ canonical: "/collections/summer?sort_by=price-ascending" });
    expect(buildAlternates({ pathname: "" })).toEqual({ canonical: "/" });
  });

  it("joins repeated filter params and keeps other repeated params", () => {
    expect(
      buildAlternates({
        pathname: "/collections/summer",
        searchParams: { "filter.p.tag": ["sale", "new"], q: ["hat", "cap"] },
      }),
    ).toEqual({ canonical: "/collections/summer?filter.p.tag=sale%2Cnew&q=hat&q=cap" });
  });

  it("fills open graph from the shop name and leaves product type unset", () => {
    expect(
      buildOpenGraph({
        description: "A hat",
        title: "Hat",
        url: "/products/hat",
      }),
    ).toEqual({
      description: "A hat",
      images: ["/og-default.png"],
      siteName: shopConfig.site.name,
      title: "Hat",
      url: "/products/hat",
    });
  });
});
