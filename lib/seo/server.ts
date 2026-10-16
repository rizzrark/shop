import { cacheKey, cacheTag, withCache } from "@/lib/cache/server";
import { fetchSitemapPage, fetchSitemapPagesCount } from "@/lib/shopify/operations/sitemap/server";
import type { ShopifySitemapType, SitemapResource } from "@/lib/shopify/operations/sitemap/types";

function sitemapCacheTags(type: ShopifySitemapType): string[] {
  if (type === "ARTICLE") return ["articles", "articles-index"];
  if (type === "BLOG") return ["blogs", "blogs-index"];
  if (type === "COLLECTION") return ["collections", "collections-index"];
  return type === "PAGE" ? ["pages"] : ["products", "products-index"];
}

function tagSitemapResources(type: ShopifySitemapType, resources: SitemapResource[]): void {
  if (type === "PAGE") return;

  if (type === "ARTICLE") {
    for (const resource of resources) {
      cacheTag(`article-${resource.blogHandle}-${resource.handle}`);
    }
    return;
  }

  const prefix = type === "BLOG" ? "blog" : type === "COLLECTION" ? "collection" : "product";
  for (const resource of resources) {
    cacheTag(`${prefix}-${resource.handle}`);
  }
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  return withCache(cacheKey("sitemap-count", { type }), "max", sitemapCacheTags(type), () =>
    fetchSitemapPagesCount(type),
  );
}

export async function getShopifySitemapPage(
  type: ShopifySitemapType,
  page: number,
): Promise<{ items: SitemapResource[] }> {
  return withCache(
    cacheKey("sitemap-page", { page, type }),
    "max",
    sitemapCacheTags(type),
    async () => {
      const result = await fetchSitemapPage(type, page);
      tagSitemapResources(type, result.items);
      return result;
    },
  );
}
