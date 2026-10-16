import { createServerFn } from "@tanstack/react-start";

import { toProductFormInput } from "@/lib/product";
import { canonicalQuickShopOptions } from "@/lib/product/quick-shop";
import type { QuickShopProduct, SelectedOption } from "@/lib/product/types";

// Purchase data loads on intent so catalog grids do not carry every product's variants.
export const loadQuickShopProductAction = createServerFn({ method: "POST" })
  .validator((data: { handle: string; selectedOptions?: SelectedOption[] }) => data)
  .handler(async ({ data }): Promise<QuickShopProduct | null> => {
    const { getProduct } = await import("@/lib/product/server");
    const { fetchProductVariant } = await import("@/lib/shopify/operations/products/server");
    const product = await getProduct({ handle: data.handle });
    if (!product || product.isGiftCard) return null;

    let variant = product.defaultVariant;
    if (data.selectedOptions !== undefined) {
      const canonicalOptions = canonicalQuickShopOptions(product.options, data.selectedOptions);
      if (!canonicalOptions) return null;
      const resolvedVariant = await fetchProductVariant({
        handle: data.handle,
        selectedOptions: canonicalOptions,
      });
      if (
        !resolvedVariant ||
        canonicalOptions.some(
          ({ name, value }) =>
            !resolvedVariant.selectedOptions.some(
              (option) => option.name === name && option.value === value,
            ),
        )
      ) {
        return null;
      }
      variant = resolvedVariant;
    }

    return {
      availableForSale: product.availableForSale,
      form: toProductFormInput(product, variant),
      image: product.featuredImage?.url ?? null,
      hasOptions: product.options.some((option) => option.values.length > 1),
      title: product.title,
    };
  });
