import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/md/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchMarkdown } = await import("@/lib/markdown/response");
        return searchMarkdown(new URL(request.url));
      },
    },
  },
});
