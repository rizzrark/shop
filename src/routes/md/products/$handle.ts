import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/md/products/$handle")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { productMarkdown } = await import("@/lib/markdown/response");
        return productMarkdown(params.handle);
      },
    },
  },
});
