import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/md/collections/$handle")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { collectionMarkdown } = await import("@/lib/markdown/response");
        return collectionMarkdown(params.handle);
      },
    },
  },
});
