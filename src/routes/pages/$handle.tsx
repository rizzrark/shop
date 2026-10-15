import { createFileRoute } from "@tanstack/react-router";

import { RichTextPage, RichTextPageSkeleton } from "@/components/content/rich-text-page";
import { ensureFound, loadContentPage } from "@/lib/data/server-fn";
import type { ContentPage as ContentPageData } from "@/lib/pages/types";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/pages/$handle")({
  loader: async ({ params }): Promise<ContentPageData> =>
    ensureFound(await loadContentPage({ data: params.handle })),
  pendingComponent: RichTextPageSkeleton,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const pathname = `/pages/${loaderData.handle}`;
    return metadataHead({
      alternates: buildAlternates({ pathname }),
      description: loaderData.seo.description,
      openGraph: buildOpenGraph({
        description: loaderData.seo.description,
        title: loaderData.seo.title,
        type: "website",
        url: pathname,
      }),
      title: loaderData.seo.title,
    });
  },
  component: ContentPage,
});

function ContentPage() {
  const page = Route.useLoaderData();
  return <RichTextPage body={page.body} title={page.title} />;
}
