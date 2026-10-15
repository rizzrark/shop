import { createFileRoute } from "@tanstack/react-router";

import { BrowseResultsFallback, CollectionResults } from "@/components/collections/browse";
import { loadAllProductsResults } from "@/lib/data/server-fn";

export const Route = createFileRoute("/collections/all/")({
  loader: ({ location }) => loadAllProductsResults({ data: { search: location.searchStr } }),
  loaderDeps: ({ search }) => search,
  pendingComponent: BrowseResultsFallback,
  component: AllProductsPage,
});

function AllProductsPage() {
  const results = Route.useLoaderData();
  return <CollectionResults results={results} />;
}
