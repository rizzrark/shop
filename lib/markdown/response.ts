import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getCollection,
} from "@/lib/collections/server";
import { shopConfig } from "@/lib/config";
import { escapeMarkdown, markdownFrontmatter } from "@/lib/markdown";
import { collectionToMarkdown } from "@/lib/markdown/collection";
import { notFoundMarkdown } from "@/lib/markdown/not-found";
import { productToMarkdown } from "@/lib/markdown/product";
import { getMarkdownRewritePath, markdownHeaders } from "@/lib/markdown/representation";
import { searchToMarkdown } from "@/lib/markdown/search";
import { getProduct } from "@/lib/product/server";

const MARKDOWN_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

export async function markdownResponse(request: Request): Promise<Response | null> {
  const rewrite = getMarkdownRewritePath(request);
  if (!rewrite) return null;
  const url = new URL(request.url);
  if (rewrite === "/md") return homeMarkdown();
  if (rewrite === "/md/search") return searchMarkdown(url);
  const product = /^\/md\/products\/([^/]+)\/?$/.exec(rewrite);
  if (product?.[1]) return productMarkdown(decodeURIComponent(product[1]));
  const collection = /^\/md\/collections\/([^/]+)\/?$/.exec(rewrite);
  if (collection?.[1]) return collectionMarkdown(decodeURIComponent(collection[1]));
  return null;
}

export function homeMarkdown(): Response {
  const { description, name, url } = shopConfig.site;
  return new Response(
    `${markdownFrontmatter({ canonicalUrl: new URL("/", url).toString(), description, title: name })}

# ${escapeMarkdown(name)}

${escapeMarkdown(description)}

## Browse

- [All products](${url}/collections/all): Browse the complete catalog.
- [Search](${url}/search): Search products by keyword.
- [Collections](${url}/collections): Browse products by collection.

## Agent resources

- [Storefront guide](${url}/llms.txt): When and how to use this storefront.
- [UCP profile](${url}/.well-known/ucp): Live catalog search, availability, cart, and checkout.
- [Sitemap](${url}/sitemap.xml): Complete index of storefront content.

---

*Locale: ${shopConfig.localization.locale}*`,
    { headers: markdownHeaders({ cacheControl: MARKDOWN_CACHE, pathname: "/" }) },
  );
}

export function searchMarkdown(url: URL): Response {
  const query = url.searchParams.get("q") ?? undefined;
  return new Response(searchToMarkdown(query), {
    headers: markdownHeaders({ cacheControl: MARKDOWN_CACHE, pathname: "/search" }),
  });
}

export async function productMarkdown(handle: string): Promise<Response> {
  const pathname = `/products/${handle}`;
  try {
    const product = await getProduct({ handle });
    if (!product) {
      return new Response(notFoundMarkdown({ kind: "Product", value: handle }), {
        status: 404,
        headers: markdownHeaders({
          cacheControl: "public, max-age=3600, stale-while-revalidate=604800",
          pathname,
        }),
      });
    }
    return new Response(productToMarkdown(product, shopConfig.localization.locale), {
      headers: markdownHeaders({ cacheControl: MARKDOWN_CACHE, pathname }),
    });
  } catch {
    return new Response(
      "# Server Error\n\nAn error occurred while retrieving the product. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders({ cacheControl: "no-cache, no-store, must-revalidate", pathname }),
      },
    );
  }
}

export async function collectionMarkdown(handle: string): Promise<Response> {
  const pathname = `/collections/${handle}`;
  try {
    const collection =
      handle === ALL_PRODUCTS_HANDLE
        ? await getAllProductsCollection()
        : await getCollection({ handle });
    if (!collection) {
      return new Response(notFoundMarkdown({ kind: "Collection", value: handle }), {
        status: 404,
        headers: markdownHeaders({
          cacheControl: "public, max-age=3600, stale-while-revalidate=604800",
          pathname,
        }),
      });
    }
    return new Response(collectionToMarkdown(collection), {
      headers: markdownHeaders({ cacheControl: MARKDOWN_CACHE, pathname }),
    });
  } catch {
    return new Response(
      "# Server Error\n\nAn error occurred while retrieving the collection. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders({ cacheControl: "no-cache, no-store, must-revalidate", pathname }),
      },
    );
  }
}
