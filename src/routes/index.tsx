import { createFileRoute } from "@tanstack/react-router";

import { ProductsGrid } from "@/components/product/products-grid";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { loadHomeProducts } from "@/lib/data/server-fn";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/")({
  head: () => {
    const title = "Home";
    const description = "Explore featured products, curated collections, and seasonal campaigns.";
    return metadataHead({
      alternates: buildAlternates({ pathname: "/" }),
      description,
      openGraph: buildOpenGraph({ description, title, type: "website", url: "/" }),
      title,
    });
  },
  loader: () => loadHomeProducts({ data: 8 }),
  component: HomePage,
});

function HomePage() {
  const products = Route.useLoaderData();
  return (
    <Page className="pt-0">
      <Sections>
        <section className="grid grid-cols-1">
          <div className="col-start-1 row-start-1 hidden md:block md:aspect-4/1" />
          <div className="relative col-start-1 row-start-1 flex items-center justify-center px-5 py-10 lg:px-10">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <h1 className="max-w-3xl text-3xl text-foreground md:text-5xl">
                A Storefront Built on Vercel Shop
              </h1>
              <p className="max-w-xl text-sm text-foreground md:text-base">
                Agent-ready commerce, powered by Shopify and TanStack Start.
              </p>
            </div>
          </div>
        </section>
        <Container>
          <ProductsGrid
            collectionUrl="/collections/all"
            eagerCount={4}
            products={products}
            title="Products"
          />
        </Container>
      </Sections>
    </Page>
  );
}
