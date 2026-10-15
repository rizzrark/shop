import type { ProductRecommendationIntent } from "@shopify/hydrogen/storefront-api-types";

import { cacheKey, cacheTag, withCache } from "@/lib/cache/server";
import type { CommerceLocale } from "@/lib/config/types";
import type { ProductCard, ProductDetails, ProductPage } from "@/lib/product/types";
import { getNumericShopifyId } from "@/lib/shopify/id/server";
import {
  fetchProduct,
  fetchProductRecommendations,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";
import type { SearchIndexProductsParams } from "@/lib/shopify/operations/products/types";

export function tagProducts(products: Array<{ id: string }>): void {
  for (const product of products) {
    const numericId = getNumericShopifyId(product.id);
    if (numericId) cacheTag(`product-${numericId}`);
  }
}

export async function getProduct(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  return withCache(
    cacheKey("product", params),
    "max",
    ["products", `product-${params.handle}`],
    async () => {
      const product = await fetchProduct(params);
      if (product) tagProducts([product]);
      return product;
    },
  );
}

// Cursor-paginated browse reads stay uncached in lib/collections/server.ts; this serves fixed grids only.
export async function getSearchIndexProducts(
  params: SearchIndexProductsParams,
): Promise<ProductPage> {
  return withCache(
    cacheKey("search-index-products", params),
    "max",
    ["products", "products-index"],
    async () => {
      const result = await fetchSearchIndexProducts(params);
      tagProducts(result.products);
      return result;
    },
  );
}

export async function getProductRecommendations(params: {
  handle: string;
  intent: ProductRecommendationIntent;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  return withCache(
    cacheKey("product-recommendations", params),
    "max",
    ["products", `recommendations-${params.handle}`],
    async () => {
      const products = await fetchProductRecommendations(params);
      tagProducts(products);
      return products;
    },
  );
}
