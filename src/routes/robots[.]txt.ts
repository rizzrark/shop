import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { robotsDocument } = await import("@/lib/seo/documents");
        return robotsDocument();
      },
    },
  },
});
