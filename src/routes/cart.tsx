import { createFileRoute } from "@tanstack/react-router";

import { CartViewedTracker } from "@/components/analytics/trackers";
import { CartPageContent } from "@/components/cart/cart-page";
import { metadataHead } from "@/lib/seo/head";

export const Route = createFileRoute("/cart")({
  head: () =>
    metadataHead({
      robots: { follow: false, index: false },
      title: "Cart",
    }),
  component: CartPage,
});

function CartPage() {
  return (
    <>
      <CartViewedTracker />
      <CartPageContent />
    </>
  );
}
