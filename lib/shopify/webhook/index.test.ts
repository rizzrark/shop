import crypto from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { cacheKey, clearCache, withCache } from "@/lib/cache/server";
import { handleShopifyWebhook, verifyWebhook } from "@/lib/shopify/webhook";

const SECRET = "webhook-secret";

function signed(body: string, secret = SECRET): string {
  return crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

describe("shopify webhooks", () => {
  afterEach(() => {
    clearCache();
    delete process.env.SHOPIFY_WEBHOOK_SECRET;
  });

  it("accepts a matching signature and rejects a missing or altered one", () => {
    const body = '{"handle":"hat"}';
    expect(verifyWebhook(body, signed(body), SECRET)).toBe(true);
    expect(verifyWebhook(body, null, SECRET)).toBe(false);
    expect(verifyWebhook(`${body} `, signed(body), SECRET)).toBe(false);
  });

  it("hides the endpoint when the webhook secret is unset", async () => {
    const response = await handleShopifyWebhook(
      new Request("http://localhost/api/webhooks/shopify"),
    );
    expect(response.status).toBe(404);
  });

  it("rejects a body whose signature does not match", async () => {
    process.env.SHOPIFY_WEBHOOK_SECRET = SECRET;
    const response = await handleShopifyWebhook(
      new Request("http://localhost/api/webhooks/shopify", {
        body: "{}",
        headers: { "x-shopify-hmac-sha256": signed("other"), "x-shopify-topic": "products/update" },
        method: "POST",
      }),
    );
    expect(response.status).toBe(401);
  });

  it("invalidates the product tags named in an update", async () => {
    process.env.SHOPIFY_WEBHOOK_SECRET = SECRET;
    const key = cacheKey("product", { handle: "hat" });
    await withCache(key, "max", ["product-hat"], async () => "cached");
    const body = JSON.stringify({
      admin_graphql_api_id: "gid://shopify/Product/42",
      handle: "hat",
    });
    const response = await handleShopifyWebhook(
      new Request("http://localhost/api/webhooks/shopify", {
        body,
        headers: {
          "x-shopify-hmac-sha256": signed(body),
          "x-shopify-topic": "products/update",
        },
        method: "POST",
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      tagsInvalidated: ["product-hat", "recommendations-hat", "product-42"],
      topic: "products/update",
    });
  });
});
