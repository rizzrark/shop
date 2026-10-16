# Collection and Search Routes

## Reference implementation

- Docs: [PLP anatomy](https://vercel.shop/docs/anatomy/pages/plp), [route reference](https://vercel.shop/docs/reference/routes)
- Collection routes: `src/routes/collections/index.tsx`, `src/routes/collections/all.tsx` with `src/routes/collections/all/index.tsx`, and `src/routes/collections/$handle.tsx` with `src/routes/collections/$handle/index.tsx`
- Browse routing: `isRefinedCollectionPath` in `lib/collections/index.ts`, applied by `src/start.ts` (a direct `/refine` path is 404; filters stay on the public URL)
- Search routes: `src/routes/search.tsx` and `src/routes/search/index.tsx`
- Components: `components/collections/`, `components/product-card/product-card.tsx`
- Browse state and cache decisions: `lib/collections/{index,server,action,types}.ts`, `lib/search/server.ts`, `lib/product/server.ts`
- Operations and transforms: `lib/shopify/operations/collections/server.ts`, `lib/shopify/operations/products/server.ts`, `lib/shopify/transforms/collection/index.ts`, `lib/shopify/transforms/filters/index.ts`
- Public source fallback: [template source](https://github.com/vercel/shop)

## Keep the default view static

A collection or `/collections/all` with no filters and no sort server-renders the cached first page from `getCollectionResults` or `getAllProductsResults`. Filtered and sorted URLs stay on that public path and call `fetch*`. `src/start.ts` returns 404 for a direct `/refine` request. There is no refine route file. Filters navigate on the public path.

- The collection layout and its index child share `CollectionLayout`, which owns the header, the browse store (`CollectionBrowseFrame`), the toolbar, and the filter sheet. The parent loader does not depend on search, so a filter keeps the toolbar mounted and only the index `pendingComponent` replaces the grid.
- Build browse URLs from the public path. Do not call `usePathname()` to build them.
- Each index route renders its results inside `CollectionBrowseBoundary`. `CollectionResults` renders the grid and hands the page's facets and data search to the layout through `BrowsePublisher`, which also reads the committed URL so unrelated params such as `utm_*` carry into the next filter change.
- The first filter or sort keeps the toolbar and open filter sheet, and only the grid shows its skeleton until results arrive.
- The store renders before the page, so on a direct load of a filtered URL the active-filter badge appears at hydration. Until a page publishes its results, the store follows the URL with an empty data search, so it reads as loading: sort waits and the filter sheet shows its skeleton, and no change can start from an empty browse state.
- Do not move the collection header into the results boundary or give `getCollection` request-time inputs.

Search is different: its query and results are request inputs. Keep its heading in the shell and stream results, facets, and counts behind their own boundaries.

## One browse store for collections and search

Collections and `/search` share the same Hydrogen collection store. `CollectionBrowseFrame` (collections, in the layout) and `CollectionBrowseProvider` (search, in the page) wrap `CollectionProvider` from `@shopify/hydrogen/react`; filters, sort, badges, and load-more all read from `useCollection()` and mutate through `useCollectionActions()`. Do not reintroduce a parallel `URLSearchParams`-driven path for search.

- URL vocabulary is Hydrogen's Liquid-compatible `filter.*` and `sort_by` (`price-descending`, `best-selling`). `resolveBrowseParams` in `lib/collections/index.ts` is the only place that turns a search string into Hydrogen's `ProductFilter[]` and `sort_by` value; routes (through `readBrowseState`), the load-more server function, and `src/start.ts` (through `isRefinedCollectionPath`) call it. Selected state, badges, and facet pruning use Hydrogen's `isFilterInputActive`; there is no parallel `filter.*` record. Hydrogen folds the taxonomy metafield namespace into `key`, so the Shopify operations split it back out at the query boundary.
- Search mounts the store with `handle={\`search:${q}\`}` so a new term rebuilds state and drops stale filters. `q` and `collection` are not store-owned, so the reconciler preserves them across filter and sort changes.
- Search only sorts by relevance and price. Pass `SEARCH_SORT_EXCLUDE` to `CollectionsSortSelect`; no `sort_by` means `RELEVANCE`.
- Filter links and active-filter badges render real `href`s built with `serializeCollectionParams` and `getFilterRemovalUrl`, then `preventDefault` into the store action so no-JS navigation still works.
- Collection pages render `BrowseResults` through `CollectionResults`, and `/search` through `Browse`, which also mounts its own store and toolbar. The results' `source` names the Storefront backend: collection products for `/collections/$handle`, the search index for `/search` and `/collections/all`. Cursors are only valid for the backend that issued them.
- `InfiniteProductGrid` serializes the current store state into `search` on every load-more call. `loadMoreBrowseProductsAction` accepts `{ cursor, search, source }` rather than a frozen filter snapshot.

## Results and controls

- Derive search state once and share its promise with results, facets, counts, and controls.
- Run result and facet queries concurrently when neither depends on the other.
- Use separate boundaries when toolbar, facets, and results can become useful independently.
- Keep the grid server-rendered. Isolate URL updates, pending state, drawers, and infinite-scroll observation in client leaves.
- Keep the current results visible and dimmed while the browse store's `status` is `loading`; avoid blanking the grid or the route.
- Keep skeleton cards dimensionally identical to real cards at every breakpoint.

## Images and pagination

- Keep product-card images at the shared `sizes="100vw"` so grids, product pages, cart, and the agent reuse the same small-screen or large-screen asset. Do not tune `sizes` to the column count.
- Keep grid images lazy by default. A dense grid magnifies every eager-loading or prefetch decision.
- Bound the initial query and payload. Fetch later pages only when requested or near the viewport.
- Deduplicate appended products and stop observers when `hasNextPage` is false.

## Prefetch traffic

Product grids are high fanout. Cards link through the shared `Link` from `@/components/ui/link`, which preloads a route on intent and does not preload every card. Do not preload the whole grid. Compare navigation latency against request volume only when preload behavior is explicitly being investigated.
