import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/md/")({
  server: {
    handlers: {
      GET: async () => {
        const { homeMarkdown } = await import("@/lib/markdown/response");
        return homeMarkdown();
      },
    },
  },
});
