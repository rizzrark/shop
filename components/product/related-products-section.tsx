import { ProductCard } from "@/components/product-card/product-card";
import type { ProductCard as ProductCardData } from "@/lib/product/types";

export function RelatedProductsSection({
  limit,
  products,
}: {
  limit: number;
  products: ProductCardData[];
}) {
  const related = products.slice(0, limit);
  if (related.length === 0) return null;
  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl">You May Also Like</h2>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} outOfStockText="Out of Stock" />
        ))}
      </div>
    </div>
  );
}
