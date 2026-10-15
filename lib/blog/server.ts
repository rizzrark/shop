import type { Blog, BlogArticle } from "@/lib/blog/types";
import { cacheKey, withCache } from "@/lib/cache/server";
import type { CommerceLocale } from "@/lib/config/types";
import { fetchBlog, fetchBlogArticle } from "@/lib/shopify/operations/blogs/server";

export async function getBlog(params: {
  handle: string;
  limit?: number;
  locale?: CommerceLocale;
}): Promise<Blog | undefined> {
  return withCache(
    cacheKey("blog", params),
    "max",
    ["articles", "blogs", `blog-${params.handle}`],
    () => fetchBlog(params),
  );
}

export async function getBlogArticle(params: {
  articleHandle: string;
  blogHandle: string;
  locale?: CommerceLocale;
}): Promise<BlogArticle | undefined> {
  return withCache(
    cacheKey("blog-article", params),
    "max",
    [
      "articles",
      "blogs",
      `article-${params.blogHandle}-${params.articleHandle}`,
      `blog-${params.blogHandle}`,
    ],
    () => fetchBlogArticle(params),
  );
}
