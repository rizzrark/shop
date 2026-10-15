import crypto from "node:crypto";

import { revalidateTag } from "@/lib/cache/server";
import { getNumericShopifyId } from "@/lib/shopify/id/server";

export function verifyWebhook(body: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(body, "utf8").digest();
  const received = Buffer.from(hmacHeader, "base64");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function handleShopifyWebhook(request: Request): Promise<Response> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 404 });

  const body = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

  if (!verifyWebhook(body, hmacHeader, secret)) {
    console.error("Invalid Shopify webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!topic) {
    return Response.json({ error: "Missing topic header" }, { status: 400 });
  }

  const tagsInvalidated = invalidateWebhookTags(topic, body);

  return Response.json({
    success: true,
    topic,
    tagsInvalidated,
  });
}

function invalidateWebhookTags(topic: string, body: string): string[] {
  const tagsInvalidated: string[] = [];

  if (topic.startsWith("products/")) {
    const productTags: string[] = [];

    if (topic === "products/create" || topic === "products/delete") {
      productTags.push("products-index");
    }

    try {
      const payload = JSON.parse(body);
      if (payload.handle) {
        productTags.push(`product-${payload.handle}`);
        productTags.push(`recommendations-${payload.handle}`);
      }
      if (payload.admin_graphql_api_id) {
        const numericId = getNumericShopifyId(payload.admin_graphql_api_id);
        if (numericId) productTags.push(`product-${numericId}`);
      } else if (payload.id) {
        productTags.push(`product-${payload.id}`);
      }
    } catch {
      console.error("[Shopify Webhook] Could not parse products payload; no tags invalidated");
    }

    for (const tag of productTags) {
      revalidateTag(tag, { expire: 0 });
      tagsInvalidated.push(tag);
    }
  }

  if (topic.startsWith("collections/")) {
    const collectionTags: string[] = [];

    if (topic === "collections/create" || topic === "collections/delete") {
      collectionTags.push("collections-index");
    }

    try {
      const payload = JSON.parse(body);
      if (payload.handle) collectionTags.push(`collection-${payload.handle}`);
    } catch {
      console.error("[Shopify Webhook] Could not parse collections payload");
    }

    for (const tag of collectionTags) {
      revalidateTag(tag, { expire: 0 });
      tagsInvalidated.push(tag);
    }
  }

  if (topic.startsWith("metaobjects/")) {
    const metaobjectTags = ["metaobjects"];

    try {
      const payload = JSON.parse(body);
      if (payload.handle) metaobjectTags.push(`metaobject-${payload.handle}`);
    } catch {
      console.error("[Shopify Webhook] Could not parse metaobjects payload");
    }

    for (const tag of metaobjectTags) {
      revalidateTag(tag, { expire: 0 });
      tagsInvalidated.push(tag);
    }
  }

  return tagsInvalidated;
}
