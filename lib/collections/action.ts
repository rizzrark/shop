import { createServerFn } from "@tanstack/react-start";

import { PRODUCTS_PER_PAGE, resolveBrowseParams } from "@/lib/collections";
import type { BrowseSource } from "@/lib/collections/types";
import type { ProductPage } from "@/lib/product/types";

export const loadMoreBrowseProductsAction = createServerFn({ method: "POST" })
  .validator((data: { cursor: string; search: string; source: BrowseSource }) => data)
  .handler(async ({ data }): Promise<ProductPage> => {
    const { fetchCollectionProducts, fetchSearchIndexProducts } =
      await import("@/lib/shopify/operations/products/server");
    const { filters, sort } = resolveBrowseParams(data.search);
    const page = { cursor: data.cursor, filters, limit: PRODUCTS_PER_PAGE, sortKey: sort };
    if (data.source.type === "search") {
      // Storefront `search` cursor is anchored to the original `first`; using a different page size returns count=0.
      return fetchSearchIndexProducts({ ...page, query: data.source.query });
    }
    const { pageInfo, products } = await fetchCollectionProducts({
      ...page,
      collection: data.source.collection,
    });
    return { pageInfo, products };
  });
