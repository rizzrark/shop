import { createFileRoute } from "@tanstack/react-router";

import { AddressBook } from "@/components/account/address-book";
import { AccountPageHeader } from "@/components/account/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { loadAddresses } from "@/lib/data/server-fn";

export const Route = createFileRoute("/account/_authenticated/addresses")({
  loader: () => loadAddresses(),
  pendingComponent: AddressesSkeleton,
  component: AddressesPage,
});

function AddressesPage() {
  const addresses = Route.useLoaderData();
  return (
    <>
      <AccountPageHeader description="Manage your saved addresses" title="Addresses" />
      <AddressBook addresses={addresses} />
    </>
  );
}

function AddressesSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3">
      <Skeleton className="h-9 w-32 rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  );
}
