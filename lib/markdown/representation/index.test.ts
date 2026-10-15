import { describe, expect, it } from "vitest";

import {
  getMarkdownMirrorPath,
  getMarkdownPath,
  getMarkdownRewritePath,
  markdownHeaders,
} from "@/lib/markdown/representation";

describe("markdown representation", () => {
  it("maps the public pages that have a markdown twin", () => {
    expect(getMarkdownPath("/")).toBe("/md");
    expect(getMarkdownPath("/search")).toBe("/md/search");
    expect(getMarkdownPath("/collections/summer")).toBe("/md/collections/summer");
    expect(getMarkdownPath("/products/hat")).toBe("/md/products/hat");
    expect(getMarkdownPath("/cart")).toBeNull();
    expect(getMarkdownPath("/pages/about")).toBeNull();
  });

  it("maps .md mirrors, including the home page index", () => {
    expect(getMarkdownMirrorPath("/index.md")).toBe("/md");
    expect(getMarkdownMirrorPath("/search.md")).toBe("/md/search");
    expect(getMarkdownMirrorPath("/products/hat.md")).toBe("/md/products/hat");
    expect(getMarkdownMirrorPath("/cart.md")).toBeNull();
    expect(getMarkdownMirrorPath("/products/hat")).toBeNull();
  });

  it("rewrites GET and HEAD when the client prefers markdown", () => {
    expect(rewrite("GET", "/", "text/markdown")).toBe("/md");
    expect(rewrite("HEAD", "/products/hat", "text/markdown, text/html")).toBe("/md/products/hat");
    expect(rewrite("GET", "/products/hat", "text/html, text/markdown")).toBeNull();
    expect(rewrite("GET", "/search", "text/markdown;q=1, text/html;q=0.8")).toBe("/md/search");
  });

  it("keeps HTML for other methods, html preference, and wildcard accept", () => {
    expect(rewrite("POST", "/", "text/markdown")).toBeNull();
    expect(rewrite("GET", "/", "text/html")).toBeNull();
    expect(rewrite("GET", "/", "*/*")).toBeNull();
    expect(rewrite("GET", "/", "text/markdown;q=0, text/html")).toBeNull();
    expect(rewrite("GET", "/", null)).toBeNull();
  });

  it("still rewrites an explicit .md URL when the accept header is html", () => {
    expect(rewrite("GET", "/collections/summer.md", "text/html")).toBe("/md/collections/summer");
    expect(rewrite("GET", "/index.md", "text/html")).toBe("/md");
  });

  it("marks markdown responses as unindexed alternates of the html page", () => {
    const headers = markdownHeaders({
      cacheControl: "public, max-age=60",
      pathname: "/products/hat",
    });
    expect(headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(headers.get("X-Robots-Tag")).toBe("noindex");
    expect(headers.get("Vary")).toBe("Accept");
    expect(headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(headers.get("Link")).toContain('rel="canonical"');
    expect(headers.get("Link")).toContain("/products/hat");
  });
});

function rewrite(method: string, pathname: string, accept: string | null): string | null {
  const headers = new Headers();
  if (accept !== null) headers.set("Accept", accept);
  return getMarkdownRewritePath(
    new Request(`http://localhost:3000${pathname}`, { headers, method }),
  );
}
