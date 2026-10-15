import { shopConfig } from "@/lib/config";

import type { DocumentImage, DocumentMetadata } from "./index";

interface HeadMeta {
  charSet?: string;
  content?: string;
  name?: string;
  property?: string;
  title?: string;
}

interface HeadLink {
  href: string;
  rel: string;
}

export function metadataHead(metadata: DocumentMetadata): { links: HeadLink[]; meta: HeadMeta[] } {
  const meta: HeadMeta[] = [];
  const links: HeadLink[] = [];
  const title = documentTitle(metadata.title);
  if (title) meta.push({ title });
  if (metadata.description) meta.push({ content: metadata.description, name: "description" });
  if (metadata.robots) {
    const directives = [
      metadata.robots.index === false ? "noindex" : undefined,
      metadata.robots.follow === false ? "nofollow" : undefined,
    ].filter(Boolean);
    if (directives.length > 0) meta.push({ content: directives.join(", "), name: "robots" });
  }

  const canonical = metadata.alternates?.canonical;
  if (canonical) links.push({ href: absoluteUrl(canonical), rel: "canonical" });

  const openGraph = metadata.openGraph;
  if (openGraph) {
    if (openGraph.title) meta.push({ content: openGraph.title, property: "og:title" });
    if (openGraph.description) {
      meta.push({ content: openGraph.description, property: "og:description" });
    }
    if (openGraph.type) meta.push({ content: openGraph.type, property: "og:type" });
    if (openGraph.url) meta.push({ content: absoluteUrl(openGraph.url), property: "og:url" });
    if (openGraph.siteName) meta.push({ content: openGraph.siteName, property: "og:site_name" });
    for (const image of openGraph.images ?? []) pushImageMeta(meta, "og:image", image);
  }

  const twitter = metadata.twitter;
  if (twitter) {
    if (twitter.card) meta.push({ content: twitter.card, name: "twitter:card" });
    if (twitter.title) meta.push({ content: twitter.title, name: "twitter:title" });
    if (twitter.description) {
      meta.push({ content: twitter.description, name: "twitter:description" });
    }
    for (const image of twitter.images ?? []) pushImageMeta(meta, "twitter:image", image);
  }

  return { links, meta };
}

function documentTitle(title: DocumentMetadata["title"]): string | undefined {
  if (!title) return undefined;
  if (typeof title === "string") return `${title} | ${shopConfig.site.name}`;
  return title.default;
}

function absoluteUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return new URL(value, shopConfig.site.url).toString();
}

function pushImageMeta(meta: HeadMeta[], key: string, image: string | DocumentImage): void {
  const url = typeof image === "string" ? image : image.url;
  const property = key.startsWith("og:") ? "property" : "name";
  meta.push({ content: absoluteUrl(url), [property]: key });
}
