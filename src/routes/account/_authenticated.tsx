import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";

import { AccountMobileTabs } from "@/components/account/mobile-tabs";
import { AccountSidebar } from "@/components/account/sidebar";
import { SignOutButton } from "@/components/account/sign-out-button";
import { ErrorBoundaryContent } from "@/components/error/error-boundary-content";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { shopConfig } from "@/lib/config";
import { loadAccountProfile, requireCustomerSessionFn } from "@/lib/data/server-fn";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/account/_authenticated")({
  beforeLoad: async () => {
    if (!shopConfig.auth.isEnabled) throw notFound();
    await requireCustomerSessionFn();
  },
  errorComponent: ({ reset }) => <ErrorBoundaryContent retry={reset} />,
  head: () =>
    metadataHead({
      robots: { follow: false, index: false },
      title: "Account",
    }),
  loader: () => loadAccountProfile(),
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <Page className="flex flex-1 flex-col">
      <Container className="flex flex-1 flex-col gap-6 md:flex-row md:gap-10">
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-24 flex flex-col gap-6">
            <AccountLabel />
            <Suspense fallback={<SidebarSkeleton />}>
              <AccountSidebar />
            </Suspense>
            <SignOutButton />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <AccountLabel />
            <SignOutButton />
          </div>
          <Suspense>
            <AccountMobileTabs />
          </Suspense>
          <Sections className="gap-5 pt-6 md:pt-0">
            <Outlet />
          </Sections>
        </div>
      </Container>
    </Page>
  );
}

function AccountLabel() {
  const profile = Route.useLoaderData();
  if (!profile) return <p className="text-sm font-medium">Account</p>;
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  return (
    <div>
      <p className="text-sm font-medium">{name || profile.email}</p>
      <p className="text-xs text-muted-foreground">{profile.email}</p>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}
