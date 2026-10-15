import { describe, expect, it } from "vitest";

import {
  getRefinedCollectionPath,
  isRefinedCollectionPath,
  resolveBrowseParams,
} from "@/lib/collections";

describe("collection browse URLs", () => {
  it("keeps the default collection view on an empty or non-browse query", () => {
    expect(getRefinedCollectionPath("/collections/summer", "")).toBeNull();
    expect(getRefinedCollectionPath("/collections/all", "?cursor=abc")).toBeNull();
    expect(getRefinedCollectionPath("/collections/summer", "q=hat")).toBeNull();
    expect(getRefinedCollectionPath("/collections/summer", "sort_by=relevance")).toBeNull();
  });

  it("rewrites a browse query to the internal refine path", () => {
    expect(getRefinedCollectionPath("/collections/summer/", "sort_by=price-ascending")).toBe(
      "/collections/summer/refine",
    );
    expect(getRefinedCollectionPath("/collections/all", "sort_by=manual")).toBe(
      "/collections/all/refine",
    );
    expect(getRefinedCollectionPath("/collections/summer", "filter.p.tag=sale")).toBe(
      "/collections/summer/refine",
    );
    expect(getRefinedCollectionPath("/collections/summer", "sort_by=best-selling")).toBe(
      "/collections/summer/refine",
    );
  });

  it("does not treat a refine path as a public collection path", () => {
    expect(
      getRefinedCollectionPath("/collections/summer/refine", "sort_by=price-ascending"),
    ).toBeNull();
    expect(isRefinedCollectionPath("/collections/summer/refine")).toBe(true);
    expect(isRefinedCollectionPath("/collections/all/refine/")).toBe(true);
    expect(isRefinedCollectionPath("/collections/summer")).toBe(false);
    expect(isRefinedCollectionPath("/products/hat")).toBe(false);
  });

  it("drops pagination and unrelated params from the browse state", () => {
    const browse = resolveBrowseParams("sort_by=price-descending&cursor=abc&q=hat");
    expect(browse.sort).toBe("price-descending");
    expect(browse.dataSearch).toBe("sort_by=price-descending");
    expect(browse.filters).toEqual([]);
  });
});
