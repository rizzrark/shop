import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { sitemapIndex } = await import("@/lib/seo/documents");
        return sitemapIndex();
      },
    },
  },
});
