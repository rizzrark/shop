import { HandbagIcon } from "lucide-react";

import type { Cart } from "@/lib/cart/types";

import { CartIconClient } from "./cart-client";

export function CartIcon({ cart }: { cart: Cart | null }) {
  return <CartIconClient cartLabel="Cart" initialCart={cart} />;
}

export function CartIconFallback() {
  return (
    <span className="flex items-center justify-center gap-1.5 text-foreground">
      <HandbagIcon className="size-5" />
      <span className="sr-only">Cart</span>
    </span>
  );
}
