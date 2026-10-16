import { cacheKey, cacheTag, withCache } from "@/lib/cache/server";
import { describeCollection, PRODUCTS_PER_PAGE, resolveBrowseParams } from "@/lib/collections";
import type {
  BrowseResults,
  BrowseState,
  Collection,
  CollectionWithThumbnail,
} from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { tagProducts } from "@/lib/product/server";
import { buildAlternates, buildOpenGraph, type DocumentMetadata } from "@/lib/seo";
import {
  fetchCollection,
  fetchCollections,
  fetchCollectionsListing,
} from "@/lib/shopify/operations/collections/server";
import {
  fetchCollectionProducts,
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

// /collections/all is a local virtual collection with no Storefront API equivalent.
export const ALL_PRODUCTS_HANDLE = "all";

function tagCollections(collections: Array<{ handle: string }>): void {
  for (const collection of collections) {
    cacheTag(`collection-${collection.handle}`);
  }
}

export async function getCollections(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<Collection[]> {
  return withCache(
    cacheKey("collections", params),
    "max",
    ["collections", "collections-index"],
    async () => {
      const collections = await fetchCollections(params);
      tagCollections(collections);
      return collections;
    },
  );
}

export async function getCollection(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<Collection | undefined> {
  return withCache(
    cacheKey("collection", params),
    "max",
    ["collections", `collection-${params.handle}`],
    () => fetchCollection(params),
  );
}

export async function getCollectionsListing(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<CollectionWithThumbnail[]> {
  return withCache(
    cacheKey("collections-listing", params),
    "max",
    ["collections", "collections-index"],
    async () => {
      const collections = await fetchCollectionsListing(params);
      tagCollections(collections);
      // Thumbnails fall back to product imagery, so product updates must refresh the listing.
      tagProducts(
        collections.flatMap((collection) =>
          collection.thumbnailProductId ? [{ id: collection.thumbnailProductId }] : [],
        ),
      );
      return collections;
    },
  );
}

export async function readBrowseState(
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>,
): Promise<BrowseState> {
  return resolveBrowseParams(recordToSearchParams(await searchParamsPromise));
}

function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

// The default view, unfiltered and in its default sort: "minutes" bounds Search & Discovery edits, which send no webhook, and Load more's product dedupe absorbs cursor drift.
export async function getCollectionResults(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<BrowseResults> {
  return withCache(
    cacheKey("collection-results", params),
    "minutes",
    ["collections", `collection-${params.handle}`, "products-index"],
    async () => {
      const { facets, pageInfo, products } = await fetchCollectionProducts({
        collection: params.handle,
        limit: PRODUCTS_PER_PAGE,
        locale: params.locale,
      });
      tagProducts(products);
      return {
        dataSearch: "",
        facets,
        pageInfo,
        products,
        source: { collection: params.handle, type: "collection" as const },
      };
    },
  );
}

export async function getAllProductsResults(
  params: { locale?: CommerceLocale } = {},
): Promise<BrowseResults> {
  return withCache(
    cacheKey("all-products-results", params),
    "minutes",
    ["products-index"],
    async () => {
      const [{ pageInfo, products }, { facets, total }] = await Promise.all([
        fetchSearchIndexProducts({ limit: PRODUCTS_PER_PAGE, locale: params.locale }),
        fetchSearchFacets({ locale: params.locale }),
      ]);
      tagProducts(products);
      return {
        dataSearch: "",
        facets,
        pageInfo,
        products,
        source: { type: "search" as const },
        total,
      };
    },
  );
}

// Filtered and sorted views stay live; a cache entry per combination would rarely be reused.
export async function fetchCollectionResults({
  handle,
  statePromise,
}: {
  handle: string;
  statePromise: Promise<BrowseState>;
}): Promise<BrowseResults> {
  const { dataSearch, filters, sort } = await statePromise;
  const { facets, pageInfo, products } = await fetchCollectionProducts({
    collection: handle,
    filters,
    limit: PRODUCTS_PER_PAGE,
    sortKey: sort,
  });
  return {
    dataSearch,
    facets,
    pageInfo,
    products,
    source: { collection: handle, type: "collection" },
  };
}

export async function getAllProductsCollection(): Promise<Collection> {
  const title = "Products";
  const description = "";
  return {
    handle: ALL_PRODUCTS_HANDLE,
    title,
    description,
    image: null,
    path: `/collections/${ALL_PRODUCTS_HANDLE}`,
    seo: {
      description: `Browse every product at ${shopConfig.site.name}: compare prices and check availability.`,
      title,
    },
  };
}

function browseMetadata(handle: string, title: string, description: string): DocumentMetadata {
  const url = `/collections/${handle}`;
  return {
    title,
    description,
    alternates: buildAlternates({ pathname: url }),
    openGraph: buildOpenGraph({ title, description, url, type: "website" }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export async function getCollectionMetadata(handle: string): Promise<DocumentMetadata> {
  const collection = await getCollection({ handle });
  if (!collection) return browseMetadata(handle, "Collection", "Browse collection products.");
  return browseMetadata(collection.handle, collection.seo.title, describeCollection(collection));
}

export async function getAllProductsMetadata(): Promise<DocumentMetadata> {
  return browseMetadata(
    ALL_PRODUCTS_HANDLE,
    "Products",
    describeCollection(await getAllProductsCollection()),
  );
}
