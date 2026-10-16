import { createFileRoute } from "@tanstack/react-router";

import {
  formatOrderDate,
  humanizeStatus,
  OrderStatusBadge,
} from "@/components/account/order-display";
import { AccountPageHeader } from "@/components/account/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderLineItem } from "@/lib/customer/types";
import { ensureFound, loadOrder } from "@/lib/data/server-fn";
import { formatPrice } from "@/lib/money";
import type { Money } from "@/lib/money/types";

export const Route = createFileRoute("/account/_authenticated/orders/$id")({
  loader: async ({ params }) => ensureFound(await loadOrder({ data: params.id })),
  pendingComponent: OrderDetailSkeleton,
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const order = Route.useLoaderData();
  return (
    <>
      <AccountPageHeader description={formatOrderDate(order.processedAt)} title={order.name} />
      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.fulfillmentStatus} />
        {order.financialStatus ? (
          <Badge variant="outline">{humanizeStatus(order.financialStatus)}</Badge>
        ) : null}
      </div>
      <ul className="grid divide-y rounded-lg border">
        {order.lineItems.map((item, index) => (
          <OrderLineItemRow key={index} item={item} />
        ))}
      </ul>
      <dl className="grid gap-2 rounded-lg border p-4 text-sm">
        <SummaryRow label="Subtotal" money={order.subtotal} />
        <SummaryRow label="Shipping" money={order.totalShipping} />
        <SummaryRow label="Tax" money={order.totalTax} />
        <div className="flex items-center justify-between border-t pt-2 font-medium">
          <dt>Total</dt>
          <dd className="font-mono tabular-nums">{formatPrice(order.totalPrice)}</dd>
        </div>
      </dl>
      {order.shippingAddress && order.shippingAddress.formatted.length > 0 ? (
        <div className="grid gap-2 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Shipping address</h2>
          <address className="text-sm text-muted-foreground not-italic">
            {order.shippingAddress.formatted.map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={order.statusPageUrl} rel="noopener noreferrer" target="_blank">
            View order status
          </a>
        </Button>
      </div>
    </>
  );
}

function OrderLineItemRow({ item }: { item: OrderLineItem }) {
  return (
    <li className="flex items-center gap-3 p-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image ? (
          <Image
            alt={item.image.altText}
            className="object-cover"
            fill
            sizes="100vw"
            src={item.image.url}
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        {item.variantTitle ? (
          <p className="truncate text-xs text-muted-foreground">{item.variantTitle}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
      </div>
      {item.totalPrice ? (
        <span className="font-mono text-sm tabular-nums">{formatPrice(item.totalPrice)}</span>
      ) : null}
    </li>
  );
}

function SummaryRow({ label, money }: { label: string; money: Money | null }) {
  if (!money) return null;
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">{formatPrice(money)}</dd>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
