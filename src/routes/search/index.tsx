import { createFileRoute } from "@tanstack/react-router";

import { Browse } from "@/components/collections/browse";
import { BrowseFallback } from "@/components/collections/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { SEARCH_SORT_EXCLUDE } from "@/lib/collections";
import { formatCount } from "@/lib/content";
import { loadSearchPage } from "@/lib/data/server-fn";

export const Route = createFileRoute("/search/")({
  loader: ({ location }) => loadSearchPage({ data: { search: location.searchStr } }),
  loaderDeps: ({ search }) => search,
  pendingComponent: SearchPending,
  component: SearchResults,
});

function SearchResults() {
  const { query, results, state } = Route.useLoaderData();
  return (
    <Browse
      path="/search"
      resultCount={results.total ? formatCount(results.total, "Item") : null}
      results={results}
      sortExclude={SEARCH_SORT_EXCLUDE}
      state={state}
      storeKey={`search:${query}`}
    />
  );
}

function SearchPending() {
  return <BrowseFallback resultCount={<Skeleton className="h-4 w-20" />} />;
}
