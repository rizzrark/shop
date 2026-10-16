import { createRootRoute, HeadContent, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { BotIdClient } from "botid/client";
import { type ReactNode, Suspense, useEffect } from "react";

import { ActionBar } from "@/components/action-bar";
import { AgentButton } from "@/components/agent/agent-button";
import { AnalyticsComponents } from "@/components/analytics";
import { CartUI } from "@/components/cart/cart-ui";
import { CartProviderWrapper } from "@/components/cart/context";
import { CartStandardActionsScript } from "@/components/cart/standard-actions";
import { ErrorBoundaryContent } from "@/components/error/error-boundary-content";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SiteSchema } from "@/components/schema/site-schema";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { botIdProtectedRoutes } from "@/lib/botid";
import { shopConfig } from "@/lib/config";
import { type ShellData, loadShell, loadShopifyNotFoundRedirect } from "@/lib/data/server-fn";
import { buildAlternates } from "@/lib/seo";
import { metadataHead } from "@/lib/seo/head";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  errorComponent: ({ reset }) => <ErrorBoundaryContent retry={reset} />,
  head: () => ({
    links: [
      { href: appCss, rel: "stylesheet" },
      { href: "/favicon.ico", rel: "icon", sizes: "any" },
      { href: "/icon.svg", rel: "icon", type: "image/svg+xml" },
      { href: "/apple-icon.png", rel: "apple-touch-icon" },
      { href: "/manifest.webmanifest", rel: "manifest" },
      ...metadataHead({
        alternates: buildAlternates({ pathname: "/" }),
        description: `Shop premium products, curated collections, and latest offers from ${shopConfig.site.name}.`,
        openGraph: { images: [{ height: 628, url: "/og-default.png", width: 1200 }] },
        title: { default: shopConfig.site.name },
      }).links,
    ],
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1", name: "viewport" },
      { content: "#ffffff", name: "theme-color" },
      { content: shopConfig.site.name, name: "generator" },
      ...metadataHead({
        alternates: buildAlternates({ pathname: "/" }),
        description: `Shop premium products, curated collections, and latest offers from ${shopConfig.site.name}.`,
        openGraph: { images: [{ height: 628, url: "/og-default.png", width: 1200 }] },
        title: { default: shopConfig.site.name },
      }).meta,
    ],
  }),
  loader: () => loadShell() as Promise<ShellData>,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang={shopConfig.localization.locale}>
      <head>
        <HeadContent />
        {shopConfig.botid.isEnabled ? <BotIdClient protect={botIdProtectedRoutes} /> : null}
        <CartStandardActionsScript />
      </head>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { cart, cartSeed, loggedIn, policies } = Route.useLoaderData();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-5 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-foreground focus:outline-none"
      >
        Skip to content
      </a>
      <SiteSchema />
      <CartProviderWrapper cartData={cartSeed}>
        <Nav cart={cart} loggedIn={loggedIn} />
        <main id="main-content" className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
        <Footer policies={policies} />
        <CartUI />
        <Suspense>
          <ActionBar>{shopConfig.agent.isEnabled ? <AgentButton /> : null}</ActionBar>
        </Suspense>
        <Suspense>
          <AnalyticsComponents />
        </Suspense>
      </CartProviderWrapper>
    </>
  );
}

function NotFoundPage() {
  return (
    <Page className="flex flex-1 flex-col">
      {shopConfig.redirects.shopifyNotFound.isEnabled ? <ShopifyNotFoundRedirect /> : null}
      <Container className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl">Page Not Found</h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            The link may be incorrect, or the page has been removed.
          </p>
          <Link
            href="/search"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue Shopping
          </Link>
        </div>
      </Container>
    </Page>
  );
}

function ShopifyNotFoundRedirect() {
  const router = useRouter();
  useEffect(() => {
    void loadShopifyNotFoundRedirect().then((target) => {
      if (!target) return;
      void router.navigate({ href: target.href, replace: true });
    });
  }, [router]);
  return null;
}
