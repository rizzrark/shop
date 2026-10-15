import { createFileRoute } from "@tanstack/react-router";

import { formatOrderDate, OrderStatusBadge } from "@/components/account/order-display";
import { AccountPageHeader } from "@/components/account/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import { loadOrders } from "@/lib/data/server-fn";
import { formatPrice } from "@/lib/money";

export const Route = createFileRoute("/account/_authenticated/orders/")({
  loader: ({ location }) => loadOrders({ data: cursors(location.searchStr) }),
  loaderDeps: ({ search }) => search,
  pendingComponent: OrdersSkeleton,
  component: OrdersPage,
});

function OrdersPage() {
  const { orders, pageInfo } = Route.useLoaderData();
  return (
    <>
      <AccountPageHeader description="View your order history" title="Orders" />
      {orders.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-sm text-muted-foreground">You have no orders yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <ul className="grid gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${encodeURIComponent(order.id)}`}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="grid gap-1">
                    <span className="font-medium">{order.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatOrderDate(order.processedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.fulfillmentStatus} />
                    <span className="text-sm tabular-nums">{formatPrice(order.totalPrice)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {pageInfo.hasNextPage || pageInfo.hasPreviousPage ? (
            <div className="flex items-center justify-between">
              {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/account/orders?before=${encodeURIComponent(pageInfo.startCursor)}`}>
                    Newer
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              {pageInfo.hasNextPage && pageInfo.endCursor ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/account/orders?after=${encodeURIComponent(pageInfo.endCursor)}`}>
                    Older
                  </Link>
                </Button>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

function OrdersSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-18 w-full rounded-lg" />
      ))}
    </div>
  );
}

function cursors(search: string): { after?: string; before?: string } {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const after = params.get("after") ?? undefined;
  const before = params.get("before") ?? undefined;
  return { after, before };
}
