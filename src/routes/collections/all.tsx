import { createFileRoute, Outlet } from "@tanstack/react-router";

import { CollectionLayout } from "@/components/collections/collection-page";
import { describeCollection, SEARCH_SORT_EXCLUDE } from "@/lib/collections";
import { loadAllProductsCollection } from "@/lib/data/server-fn";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/collections/all")({
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const title = loaderData.seo.title;
    const description = describeCollection(loaderData);
    const url = `/collections/${loaderData.handle}`;
    return metadataHead({
      alternates: buildAlternates({ pathname: url }),
      description,
      openGraph: buildOpenGraph({ description, title, type: "website", url }),
      title,
      twitter: {
        card: "summary_large_image",
        description,
        images: ["/og-default.png"],
        title,
      },
    });
  },
  loader: () => loadAllProductsCollection(),
  component: AllProductsLayout,
});

function AllProductsLayout() {
  const collection = Route.useLoaderData();
  return (
    <CollectionLayout
      collection={collection}
      handle={collection.handle}
      sortExclude={SEARCH_SORT_EXCLUDE}
    >
      <Outlet />
    </CollectionLayout>
  );
}
