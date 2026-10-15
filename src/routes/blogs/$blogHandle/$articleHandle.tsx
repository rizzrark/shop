import { createFileRoute } from "@tanstack/react-router";

import { ArticlePage, ArticlePageSkeleton } from "@/components/blog/article-page";
import type { BlogArticle } from "@/lib/blog/types";
import { ensureFound, loadArticle } from "@/lib/data/server-fn";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/blogs/$blogHandle/$articleHandle")({
  loader: async ({ params }): Promise<BlogArticle> =>
    ensureFound(
      await loadArticle({
        data: { articleHandle: params.articleHandle, blogHandle: params.blogHandle },
      }),
    ),
  pendingComponent: ArticlePageSkeleton,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const pathname = `/blogs/${loaderData.blogHandle}/${loaderData.handle}`;
    const images = loaderData.image
      ? [
          {
            alt: loaderData.image.altText,
            height: loaderData.image.height,
            url: loaderData.image.url,
            width: loaderData.image.width,
          },
        ]
      : ["/og-default.png"];
    return metadataHead({
      alternates: buildAlternates({ pathname }),
      description: loaderData.seo.description,
      openGraph: buildOpenGraph({
        description: loaderData.seo.description,
        images,
        title: loaderData.seo.title,
        type: "article",
        url: pathname,
      }),
      title: loaderData.seo.title,
      twitter: {
        card: "summary_large_image",
        description: loaderData.seo.description,
        images,
        title: loaderData.seo.title,
      },
    });
  },
  component: BlogArticlePage,
});

function BlogArticlePage() {
  const article = Route.useLoaderData();
  return <ArticlePage article={article} />;
}
