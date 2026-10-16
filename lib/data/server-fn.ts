import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import type { Cart, CartSeedData } from "@/lib/cart/types";
import type { ShopPolicy } from "@/lib/policies/types";

export interface ShellData {
  cart: Cart | null;
  cartSeed: CartSeedData;
  loggedIn: boolean;
  policies: ShopPolicy[];
}

export const loadShell = createServerFn({ method: "POST" }).handler(async () => {
  const { isCustomerLoggedIn } = await import("@/lib/auth/server");
  const { seedCartData } = await import("@/lib/cart/server");
  const { getShopPolicies } = await import("@/lib/policies/server");
  const [cartSeed, policies, loggedIn] = await Promise.all([
    seedCartData(),
    getShopPolicies({}).catch(() => []),
    isCustomerLoggedIn().catch(() => false),
  ]);
  // Hydrogen's cart type carries an index signature Start will not serialize. The payload is JSON.
  return JSON.parse(
    JSON.stringify({
      cart: cartSeed.cart ?? null,
      cartSeed,
      loggedIn,
      policies,
    }),
  ) as any;
});

export const loadHomeProducts = createServerFn({ method: "GET" })
  .validator((limit: number) => limit)
  .handler(async ({ data: limit }) => {
    const { getSearchIndexProducts } = await import("@/lib/product/server");
    const { products } = await getSearchIndexProducts({ limit });
    return products;
  });

export const loadCollections = createServerFn({ method: "GET" }).handler(async () => {
  const { getCollectionsListing } = await import("@/lib/collections/server");
  return getCollectionsListing({});
});

export const loadCollection = createServerFn({ method: "GET" })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { getCollection } = await import("@/lib/collections/server");
    return (await getCollection({ handle })) ?? null;
  });

export const loadCollectionResults = createServerFn({ method: "GET" })
  .validator((data: { handle: string; search: string }) => data)
  .handler(async ({ data }) => {
    const { resolveBrowseParams } = await import("@/lib/collections");
    const { fetchCollectionResults, getCollectionResults } =
      await import("@/lib/collections/server");
    const state = resolveBrowseParams(data.search);
    return state.dataSearch
      ? fetchCollectionResults({ handle: data.handle, statePromise: Promise.resolve(state) })
      : getCollectionResults({ handle: data.handle });
  });

export const loadAllProductsCollection = createServerFn({ method: "GET" }).handler(async () => {
  const { getAllProductsCollection } = await import("@/lib/collections/server");
  return getAllProductsCollection();
});

export const loadAllProductsResults = createServerFn({ method: "GET" })
  .validator((data: { search: string }) => data)
  .handler(async ({ data }) => {
    const { resolveBrowseParams } = await import("@/lib/collections");
    const { getAllProductsResults } = await import("@/lib/collections/server");
    const { fetchSearchResults } = await import("@/lib/search/server");
    const state = resolveBrowseParams(data.search);
    return state.dataSearch
      ? fetchSearchResults({ statePromise: Promise.resolve(state) })
      : getAllProductsResults();
  });

export const loadSearchPage = createServerFn({ method: "GET" })
  .validator((data: { search: string }) => data)
  .handler(async ({ data }) => {
    const { resolveBrowseParams } = await import("@/lib/collections");
    const { fetchSearchResults } = await import("@/lib/search/server");
    const params = new URLSearchParams(stripQuery(data.search));
    const query = params.get("q") ?? "";
    const state = resolveBrowseParams(data.search);
    const results = await fetchSearchResults({
      query: query || undefined,
      statePromise: Promise.resolve(state),
    });
    return { query, results, state };
  });

export const loadProductPage = createServerFn({ method: "GET" })
  .validator((data: { handle: string; search: string }) => data)
  .handler(async ({ data }) => {
    const { shopConfig } = await import("@/lib/config");
    const { defaultSelectedOptions, parseSelectedOptions, toSelectedOptionList } =
      await import("@/lib/product");
    const { getProduct, getProductRecommendations } = await import("@/lib/product/server");
    const { fetchProductVariant } = await import("@/lib/shopify/operations/products/server");
    const product = await getProduct({ handle: data.handle });
    if (!product) return null;
    const search = searchRecord(data.search);
    const selectedFromUrl = parseSelectedOptions(product.options, search);
    const selectedOptions = { ...defaultSelectedOptions(product), ...selectedFromUrl };
    const variant =
      Object.keys(selectedFromUrl).length === 0
        ? product.defaultVariant
        : await fetchProductVariant({
            handle: data.handle,
            selectedOptions: toSelectedOptionList(selectedOptions),
          });
    const [related, complementary] = await Promise.all([
      shopConfig.pdp.relatedProducts.isEnabled
        ? getProductRecommendations({ handle: data.handle, intent: "RELATED" })
        : Promise.resolve([]),
      shopConfig.pdp.complementaryProducts.isEnabled
        ? getProductRecommendations({ handle: data.handle, intent: "COMPLEMENTARY" })
        : Promise.resolve([]),
    ]);
    return { complementary, product, related, selectedOptions, variant };
  });

export const loadBlog = createServerFn({ method: "GET" })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { getBlog } = await import("@/lib/blog/server");
    return (await getBlog({ handle })) ?? null;
  });

export const loadArticle = createServerFn({ method: "GET" })
  .validator((data: { articleHandle: string; blogHandle: string }) => data)
  .handler(async ({ data }) => {
    const { getBlogArticle } = await import("@/lib/blog/server");
    return (await getBlogArticle(data)) ?? null;
  });

export const loadContentPage = createServerFn({ method: "GET" })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { getPage } = await import("@/lib/pages/server");
    return (await getPage({ handle })) ?? null;
  });

export const loadPolicy = createServerFn({ method: "GET" })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { getShopPolicy } = await import("@/lib/policies/server");
    return (await getShopPolicy({ handle })) ?? null;
  });

export const requireCustomerSessionFn = createServerFn({ method: "POST" }).handler(async () => {
  const { requireCustomerSession } = await import("@/lib/auth/server");
  await requireCustomerSession();
  return true;
});

export const loadAccountProfile = createServerFn({ method: "POST" }).handler(async () => {
  const { getCustomerProfile } = await import("@/lib/shopify/operations/customer/server");
  return (await getCustomerProfile()) ?? null;
});

export const loadOrders = createServerFn({ method: "POST" })
  .validator((data: { after?: string; before?: string }) => data)
  .handler(async ({ data }) => {
    const { fetchCustomerOrders } = await import("@/lib/shopify/operations/customer/server");
    return fetchCustomerOrders(data);
  });

export const loadOrder = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { fetchCustomerOrder } = await import("@/lib/shopify/operations/customer/server");
    return (await fetchCustomerOrder(id)) ?? null;
  });

export const loadAddresses = createServerFn({ method: "POST" }).handler(async () => {
  const { fetchCustomerAddresses } = await import("@/lib/shopify/operations/customer/server");
  return fetchCustomerAddresses();
});

export const loadShopifyNotFoundRedirect = createServerFn({ method: "GET" }).handler(async () => {
  const { shopConfig } = await import("@/lib/config");
  if (!shopConfig.redirects.shopifyNotFound.isEnabled) return null;
  const { getRequest } = await import("@tanstack/react-start/server");
  const { createShopifyRequestContext, handleShopifyRedirects } = await import("@shopify/hydrogen");
  const { SHOPIFY_ROUTE_TEMPLATES } = await import("@/lib/shopify/routing");
  const { createRequestStorefrontClient } = await import("@/lib/shopify/storefront/server");
  const request = getRequest();
  const requestContext = createShopifyRequestContext({
    i18n: shopConfig.localization,
    request,
  });
  const response = await handleShopifyRedirects({
    request,
    routeTemplates: SHOPIFY_ROUTE_TEMPLATES,
    storefrontClient: createRequestStorefrontClient(requestContext),
  });
  if (!response) return null;
  const location = response.headers.get("location");
  if (!location) return null;
  const status = response.status === 301 || response.status === 308 ? 308 : 307;
  return { href: location, status };
});

export async function ensureFound<T>(value: T | null | undefined): Promise<T> {
  if (value) return value;
  const target = await loadShopifyNotFoundRedirect();
  if (target) throw redirect({ href: target.href, statusCode: target.status, throw: true });
  throw notFound();
}

function stripQuery(search: string): string {
  return search.startsWith("?") ? search.slice(1) : search;
}

function searchRecord(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(stripQuery(search));
  const record: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    const first = values[0];
    if (first === undefined) continue;
    record[key] = values.length > 1 ? values : first;
  }
  return record;
}
