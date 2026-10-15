import { getCollections } from "@/lib/collections/server";
import { shopConfig } from "@/lib/config";
import { summarizeText } from "@/lib/content";
import { escapeMarkdown } from "@/lib/markdown";
import { getShopPolicies } from "@/lib/policies/server";
import { getShopifySitemapPage, getShopifySitemapPagesCount } from "@/lib/seo/server";
import type { ShopifySitemapType } from "@/lib/shopify/operations/sitemap/types";

export function robotsDocument(): Response {
  const body = `User-Agent: *
Allow: /
Disallow: /cart
Disallow: /account
Disallow: /login
Disallow: /search
Disallow: /*/cart
Disallow: /*/account
Disallow: /*/login
Disallow: /*/search
Disallow: /collections/*?*sort=
Disallow: /collections/*?*filter.
Disallow: /*/collections/*?*sort=
Disallow: /*/collections/*?*filter.

Sitemap: ${shopConfig.site.url}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function manifestDocument(): Response {
  return Response.json({
    background_color: "#ffffff",
    description: shopConfig.site.description,
    display: "standalone",
    icons: [
      { sizes: "192x192", src: "/icons/icon-192.png", type: "image/png" },
      { sizes: "512x512", src: "/icons/icon-512.png", type: "image/png" },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/icons/icon-maskable-512.png",
        type: "image/png",
      },
    ],
    name: shopConfig.site.name,
    short_name: shopConfig.site.name,
    start_url: "/",
    theme_color: "#ffffff",
  });
}

export async function llmsDocument(): Promise<Response> {
  const { description, name, url } = shopConfig.site;
  const { country, language } = shopConfig.localization;
  const [collections, policies] = await Promise.all([
    getCollections({ limit: 50 }).catch(() => []),
    getShopPolicies().catch(() => []),
  ]);
  const collectionLinks = collections.map((collection) => {
    const link = `[${escapeMarkdown(collection.title)}](${url}${collection.path})`;
    const summary = summarizeText(collection.description);
    return summary ? `- ${link}: ${escapeMarkdown(summary)}` : `- ${link}`;
  });
  const policyLinks = policies.map(
    (policy) => `- [${escapeMarkdown(policy.title)}](${url}/policies/${policy.handle})`,
  );

  return new Response(
    `# ${escapeMarkdown(name)}

> ${escapeMarkdown(summarizeText(description))}

Home, product, collection, and search pages return Markdown with an \`Accept: text/markdown\` header or at the page URL with \`.md\` appended (\`/index.md\` for the home page). Prices and availability use Shopify country \`${country}\` and language \`${language}\`.

## Buy for a shopper

Catalog search, live availability, carts, and checkout come from Shopify through the Universal Commerce Protocol (UCP).

- [UCP profile](${url}/.well-known/ucp): Supported UCP versions, capabilities, and payment handlers.
- UCP MCP endpoint: \`POST ${url}/api/ucp/mcp\` with JSON-RPC; call \`tools/list\` for tools and schemas.

1. Find products with \`search_catalog\`, then get exact pricing, variants, and real-time availability with \`get_product\` or \`lookup_catalog\`.
2. Build a cart with \`create_cart\` and \`update_cart\`.
3. Create a checkout with \`create_checkout\`, then set the shipping address and method with \`update_checkout\`.
4. Call \`complete_checkout\` only after the shopper explicitly approves the payment.
5. Track the order with \`get_order\`.

Every call requires \`meta.ucp-agent.profile\`, your agent's UCP profile URL. Pass the shopper's \`address_country\` and \`currency\` in \`context\` for accurate prices and availability. Back off when the endpoint returns \`429\`.

## Policies

${[
  ...policyLinks,
  `- Policy and FAQ search: MCP tool \`search_shop_policies_and_faqs\` at \`POST ${url}/api/mcp\` answers questions about shipping, returns, and contacting the store.`,
].join("\n")}

## Browse

- [All products](${url}/collections/all): The full product catalog.
${collectionLinks.length > 0 ? `\n## Collections\n\n${collectionLinks.join("\n")}\n` : ""}
## Discovery

- [Sitemap](${url}/sitemap.xml): Complete index of product and collection URLs.
- [Robots](${url}/robots.txt): Crawl policy.
`,
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sitemapIndex(): Promise<Response> {
  const [articlePages, blogPages, collectionPages, pagePages, productPages] = await Promise.all([
    getShopifySitemapPagesCount("ARTICLE"),
    getShopifySitemapPagesCount("BLOG"),
    getShopifySitemapPagesCount("COLLECTION"),
    getShopifySitemapPagesCount("PAGE"),
    getShopifySitemapPagesCount("PRODUCT"),
  ]);
  const childIds = [
    "static",
    ...Array.from({ length: productPages }, (_, index) => `products-${index + 1}`),
    ...Array.from({ length: collectionPages }, (_, index) => `collections-${index + 1}`),
    ...Array.from({ length: pagePages }, (_, index) => `pages-${index + 1}`),
    ...Array.from({ length: blogPages }, (_, index) => `blogs-${index + 1}`),
    ...Array.from({ length: articlePages }, (_, index) => `articles-${index + 1}`),
  ];
  const entries = childIds
    .map(
      (id) =>
        `  <sitemap><loc>${escapeXml(`${shopConfig.site.url}/sitemap/${id}.xml`)}</loc></sitemap>`,
    )
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}

export async function sitemapShard(shard: string): Promise<Response | null> {
  const id = shard.endsWith(".xml") ? shard.slice(0, -".xml".length) : shard;
  if (id === "static") return renderStatic();
  const match = id.match(/^(articles|blogs|collections|pages|products)-(\d+)$/);
  if (!match?.[1] || !match[2]) return null;
  const types: Record<string, ShopifySitemapType> = {
    articles: "ARTICLE",
    blogs: "BLOG",
    collections: "COLLECTION",
    pages: "PAGE",
    products: "PRODUCT",
  };
  const type = types[match[1]];
  if (!type) return null;
  return renderShard(type, Number(match[2]), match[1]);
}

async function renderStatic(): Promise<Response> {
  const policies = await getShopPolicies().catch(() => []);
  const entries = ["/", ...policies.map(({ handle }) => `/policies/${handle}`)]
    .map((pathname) => `  <url><loc>${escapeXml(`${shopConfig.site.url}${pathname}`)}</loc></url>`)
    .join("\n");
  return xmlResponse(urlsetWrap(entries));
}

async function renderShard(
  type: ShopifySitemapType,
  page: number,
  segment: string,
): Promise<Response> {
  const { items } = await getShopifySitemapPage(type, page);
  const entries = items
    .map((item) => {
      const loc = escapeXml(
        `${shopConfig.site.url}${item.pathname ?? `/${segment}/${item.handle}`}`,
      );
      const lastmod = escapeXml(item.updatedAt);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    })
    .join("\n");
  return xmlResponse(urlsetWrap(entries));
}

function urlsetWrap(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function xmlResponse(body: string): Response {
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
