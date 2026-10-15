import { cacheKey, withCache } from "@/lib/cache/server";
import type { CommerceLocale } from "@/lib/config/types";
import type { ShopPolicy } from "@/lib/policies/types";
import { fetchShopPolicies } from "@/lib/shopify/operations/policies/server";

export async function getShopPolicies(
  params: { locale?: CommerceLocale } = {},
): Promise<ShopPolicy[]> {
  return withCache(cacheKey("policies", params), "max", ["policies"], () =>
    fetchShopPolicies(params),
  );
}

export async function getShopPolicy({
  handle,
  locale,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ShopPolicy | undefined> {
  const policies = await getShopPolicies({ locale });
  return policies.find((policy) => policy.handle === handle);
}
