import { cn } from "cn";
import { type ComponentProps } from "react";
import { preload } from "react-dom";

import { shopifyImageSrcSet, shopifyImageUrl } from "@/lib/media";

const DEFAULT_SIZES = "100vw";
const DEFAULT_WIDTH = 1920;

interface ImageProps extends Omit<ComponentProps<"img">, "src"> {
  fill?: boolean;
  preload?: boolean;
  src: string;
}

export function Image({
  alt,
  className,
  fill = false,
  height,
  preload: shouldPreload = false,
  sizes = DEFAULT_SIZES,
  src,
  width,
  ...props
}: ImageProps) {
  const sources = imageSources(src, sizes);
  if (shouldPreload) {
    preload(sources.src, {
      as: "image",
      fetchPriority: "high",
      imageSizes: sources.sizes,
      imageSrcSet: sources.srcSet,
    });
  }

  return (
    <img
      {...props}
      alt={alt}
      className={cn(fill && "absolute inset-0 size-full", className)}
      height={height}
      sizes={sources.sizes}
      src={sources.src}
      srcSet={sources.srcSet}
      width={width}
    />
  );
}

export function getImageProps({
  sizes = DEFAULT_SIZES,
  src,
}: {
  alt?: string;
  fill?: boolean;
  height?: number;
  sizes?: string;
  src: string;
  width?: number;
}) {
  return { props: imageSources(src, sizes) };
}

function imageSources(src: string, sizes: string) {
  const srcSet = shopifyImageSrcSet(src);
  return {
    sizes,
    src: srcSet ? shopifyImageUrl(src, DEFAULT_WIDTH) : src,
    srcSet,
  };
}
