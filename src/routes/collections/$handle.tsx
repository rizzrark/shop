import { createFileRoute, Outlet } from "@tanstack/react-router";

import {
  CollectionDetailSkeleton,
  CollectionLayout,
} from "@/components/collections/collection-page";
import { describeCollection } from "@/lib/collections";
import type { Collection } from "@/lib/collections/types";
import { ensureFound, loadCollection } from "@/lib/data/server-fn";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/collections/$handle")({
  loader: async ({ params }): Promise<Collection> =>
    ensureFound(await loadCollection({ data: params.handle })),
  pendingComponent: CollectionDetailSkeleton,
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
  component: CollectionHandleLayout,
});

function CollectionHandleLayout() {
  const collection = Route.useLoaderData();
  return (
    <CollectionLayout collection={collection} handle={collection.handle}>
      <Outlet />
    </CollectionLayout>
  );
}
