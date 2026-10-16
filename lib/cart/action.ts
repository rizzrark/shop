import { createServerFn } from "@tanstack/react-start";

export const prepareCheckoutAction = createServerFn({ method: "POST" }).handler(async () => {
  const { getCart } = await import("@/lib/cart/server");
  const { withFallback } = await import("@/lib/shopify/errors/server");
  const cart = await withFallback(getCart(), undefined);
  return { checkoutUrl: cart?.checkoutUrl ?? null };
});
