import { createFileRoute } from "@tanstack/react-router";

import { BrowseResultsFallback, CollectionResults } from "@/components/collections/browse";
import { loadCollectionResults } from "@/lib/data/server-fn";

export const Route = createFileRoute("/collections/$handle/")({
  loader: ({ location, params }) =>
    loadCollectionResults({ data: { handle: params.handle, search: location.searchStr } }),
  loaderDeps: ({ search }) => search,
  pendingComponent: BrowseResultsFallback,
  component: CollectionHandlePage,
});

function CollectionHandlePage() {
  const results = Route.useLoaderData();
  return <CollectionResults results={results} />;
}
