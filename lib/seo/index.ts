import { shopConfig } from "@/lib/config";

export interface DocumentImage {
  alt?: string | null;
  height?: number;
  url: string;
  width?: number;
}

export interface DocumentMetadata {
  alternates?: {
    canonical?: string;
  };
  description?: string;
  openGraph?: {
    description?: string;
    images?: Array<string | DocumentImage>;
    siteName?: string;
    title?: string;
    type?: "article" | "website";
    url?: string;
  };
  robots?: {
    follow?: boolean;
    index?: boolean;
  };
  title?: string | { default: string; template?: string };
  twitter?: {
    card?: string;
    description?: string;
    images?: Array<string | DocumentImage>;
    title?: string;
  };
}

import type { SearchParamsInput } from "./types";

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash === "/") return withLeadingSlash;
  return withLeadingSlash.replace(/\/+$/, "");
}

function toSearchParams(input: SearchParamsInput): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (key.startsWith("filter.")) {
        if (value.length > 0) params.set(key, value.join(","));
      } else {
        for (const item of value) {
          params.append(key, item);
        }
      }
      continue;
    }
    params.set(key, value);
  }

  return params;
}

function buildCanonicalPath(pathname: string, searchParams?: SearchParamsInput): string {
  const params = toSearchParams(searchParams);
  params.delete("cursor");

  const query = params.toString();
  const normalizedPath = normalizePath(pathname);
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

export function buildAlternates({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams?: SearchParamsInput;
}): DocumentMetadata["alternates"] {
  return { canonical: buildCanonicalPath(pathname, searchParams) };
}

export function buildOpenGraph({
  title,
  description,
  url,
  type,
  images = ["/og-default.png"],
}: {
  title: string;
  description?: string;
  url: string;
  type?: "website" | "article";
  images?: Array<
    | string
    | {
        url: string;
        width?: number;
        height?: number;
        alt?: string;
      }
  >;
}): DocumentMetadata["openGraph"] {
  // Omit type so product pages can emit og:type=product through raw meta tags.
  return {
    ...(type ? { type } : {}),
    title,
    description,
    url,
    siteName: shopConfig.site.name,
    images,
  };
}
