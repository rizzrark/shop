import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async () => {
        const { manifestDocument } = await import("@/lib/seo/documents");
        return manifestDocument();
      },
    },
  },
});
