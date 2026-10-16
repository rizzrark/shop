import { createFileRoute } from "@tanstack/react-router";

import { ProductViewedTracker } from "@/components/analytics/trackers";
import {
  ProductDetailSection,
  ProductDetailSkeleton,
} from "@/components/product-detail/product-detail-section";
import { RecentlyViewedRecorder } from "@/components/product-detail/recently-viewed";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { shopConfig } from "@/lib/config";
import { ensureFound, loadProductPage } from "@/lib/data/server-fn";
import type {
  ProductCard,
  ProductDetails,
  ProductVariant,
  SelectedOptions,
} from "@/lib/product/types";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/products/$handle")({
  loaderDeps: ({ search }) => search,
  loader: async ({
    location,
    params,
  }): Promise<{
    complementary: ProductCard[];
    product: ProductDetails;
    related: ProductCard[];
    selectedOptions: SelectedOptions;
    variant: ProductVariant | undefined;
  }> =>
    ensureFound(
      await loadProductPage({ data: { handle: params.handle, search: location.searchStr } }),
    ),
  pendingComponent: ProductPending,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const { product } = loaderData;
    const pathname = `/products/${product.handle}`;
    const images = product.featuredImage
      ? [
          {
            alt: product.featuredImage.altText,
            height: product.featuredImage.height,
            url: product.featuredImage.url,
            width: product.featuredImage.width,
          },
        ]
      : ["/og-default.png"];
    return metadataHead({
      alternates: buildAlternates({ pathname }),
      description: product.seo.description,
      openGraph: buildOpenGraph({
        description: product.seo.description,
        images,
        title: product.seo.title,
        url: pathname,
      }),
      title: product.seo.title,
      twitter: {
        card: "summary_large_image",
        description: product.seo.description,
        images,
        title: product.seo.title,
      },
    });
  },
  component: ProductPage,
});

function ProductPage() {
  const { complementary, product, related, selectedOptions, variant } = Route.useLoaderData();
  return (
    <Page className="pt-0">
      <Container className="bg-background">
        <Sections>
          <ProductViewedTracker
            product={{
              handle: product.handle,
              id: product.id,
              title: product.title,
              vendor: product.vendor,
            }}
            variantPromise={Promise.resolve(variant)}
          />
          <RecentlyViewedRecorder
            product={{
              featuredImage: product.featuredImage,
              handle: product.handle,
              id: product.id,
              price: product.price,
              title: product.title,
            }}
          />
          <ProductDetailSection
            complementary={complementary}
            product={product}
            selectedOptions={selectedOptions}
            variant={variant}
          />
          {shopConfig.pdp.relatedProducts.isEnabled ? (
            <RelatedProductsSection limit={4} products={related} />
          ) : null}
        </Sections>
      </Container>
    </Page>
  );
}

function ProductPending() {
  return (
    <Page aria-busy="true" className="pt-0">
      <Container className="bg-background">
        <Sections>
          <ProductDetailSkeleton />
        </Sections>
      </Container>
    </Page>
  );
}
