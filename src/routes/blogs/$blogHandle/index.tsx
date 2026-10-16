import { createFileRoute } from "@tanstack/react-router";

import { BlogIndex, BlogIndexSkeleton } from "@/components/blog/blog-index";
import type { Blog } from "@/lib/blog/types";
import { ensureFound, loadBlog } from "@/lib/data/server-fn";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/blogs/$blogHandle/")({
  loader: async ({ params }): Promise<Blog> =>
    ensureFound(await loadBlog({ data: params.blogHandle })),
  pendingComponent: BlogIndexSkeleton,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const pathname = `/blogs/${loaderData.handle}`;
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
  component: BlogPage,
});

function BlogPage() {
  const blog = Route.useLoaderData();
  return <BlogIndex blog={blog} />;
}
