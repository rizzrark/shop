import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/webhooks/shopify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleShopifyWebhook } = await import("@/lib/shopify/webhook");
        return handleShopifyWebhook(request);
      },
    },
  },
});
