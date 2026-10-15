export const IMAGE_WIDTHS = [1320, 1920] as const;

const SHOPIFY_IMAGE_HOST = "cdn.shopify.com";

export function shopifyImageUrl(src: string, width: number): string {
  const url = shopifyUrl(src);
  if (!url) return src;
  url.searchParams.set("width", String(width));
  return url.toString();
}

export function shopifyImageSrcSet(src: string): string | undefined {
  if (!shopifyUrl(src)) return undefined;
  return IMAGE_WIDTHS.map((width) => `${shopifyImageUrl(src, width)} ${width}w`).join(", ");
}

function shopifyUrl(src: string): URL | undefined {
  try {
    const url = new URL(src);
    return url.hostname === SHOPIFY_IMAGE_HOST ? url : undefined;
  } catch {
    return undefined;
  }
}
