import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap/$shard")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { sitemapShard } = await import("@/lib/seo/documents");
        const response = await sitemapShard(params.shard);
        return response ?? new Response("Not Found", { status: 404 });
      },
    },
  },
});
