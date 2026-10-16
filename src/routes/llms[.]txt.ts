import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { llmsDocument } = await import("@/lib/seo/documents");
        return llmsDocument();
      },
    },
  },
});
