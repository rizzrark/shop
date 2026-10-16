import { cacheKey, withCache } from "@/lib/cache/server";
import type { CommerceLocale } from "@/lib/config/types";
import type { ContentPage } from "@/lib/pages/types";
import { fetchPage } from "@/lib/shopify/operations/pages/server";

export async function getPage(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ContentPage | undefined> {
  return withCache(cacheKey("page", params), "max", ["pages", `page-${params.handle}`], () =>
    fetchPage(params),
  );
}
