import { createFileRoute } from "@tanstack/react-router";

import { RichTextPage, RichTextPageSkeleton } from "@/components/content/rich-text-page";
import { ensureFound, loadPolicy } from "@/lib/data/server-fn";
import type { ShopPolicy } from "@/lib/policies/types";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/policies/$handle")({
  loader: async ({ params }): Promise<ShopPolicy> =>
    ensureFound(await loadPolicy({ data: params.handle })),
  pendingComponent: RichTextPageSkeleton,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const pathname = `/policies/${loaderData.handle}`;
    return metadataHead({
      alternates: buildAlternates({ pathname }),
      openGraph: buildOpenGraph({ title: loaderData.title, type: "website", url: pathname }),
      title: loaderData.title,
    });
  },
  component: PolicyPage,
});

function PolicyPage() {
  const policy = Route.useLoaderData();
  return <RichTextPage body={policy.body} title={policy.title} />;
}
