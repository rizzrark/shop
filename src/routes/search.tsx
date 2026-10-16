import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SearchViewedTracker } from "@/components/analytics/trackers";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/search")({
  loaderDeps: ({ search }) => search,
  loader: ({ location }): { query: string; search: string } => {
    const search = location.searchStr;
    const query = new URLSearchParams(stripQuery(search)).get("q") ?? "";
    return { query, search };
  },
  head: ({ loaderData }) => {
    const query = loaderData?.query ?? "";
    const hasQuery = query.length > 0;
    const title = hasQuery ? `Search results for "${query}"` : "Search";
    const description = hasQuery
      ? `Find products matching "${query}"`
      : "Search for products in our store";
    return metadataHead({
      alternates: buildAlternates({
        pathname: "/search",
        searchParams: new URLSearchParams(stripQuery(loaderData?.search ?? "")),
      }),
      description,
      openGraph: buildOpenGraph({ description, title, type: "website", url: "/search" }),
      robots: { follow: false, index: false },
      title,
      twitter: {
        card: "summary_large_image",
        description,
        images: ["/og-default.png"],
        title,
      },
    });
  },
  component: SearchLayout,
});

function SearchLayout() {
  const { query } = Route.useLoaderData();
  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <SearchViewedTracker searchTerm={query} />
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl">
              <Link href="/search">Search</Link>
              {query ? ` for "${query}"` : null}
            </h1>
          </div>
          <Outlet />
        </Sections>
      </Container>
    </Page>
  );
}

function stripQuery(search: string): string {
  return search.startsWith("?") ? search.slice(1) : search;
}
