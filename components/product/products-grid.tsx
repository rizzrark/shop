import { cn } from "cn";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { Link } from "@/components/ui/link";
import type { ProductCard as ProductCardData } from "@/lib/product/types";

interface ProductsGridSkeletonProps {
  count: number;
  className?: string;
}

export function ProductsGridSkeleton({ count, className }: ProductsGridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface ProductsGridProps {
  collectionUrl?: string;
  eagerCount?: number;
  products: ProductCardData[];
  title: string;
}

export function ProductsGrid({
  collectionUrl,
  eagerCount = 0,
  products,
  title,
}: ProductsGridProps) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {collectionUrl && (
          <Link
            href={collectionUrl}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
          </Link>
        )}
      </div>
      {products.length === 0 ? null : (
        <ProductsGridContent
          eagerCount={eagerCount}
          outOfStockText="Out of Stock"
          products={products}
        />
      )}
    </div>
  );
}

function ProductsGridContent({
  eagerCount,
  outOfStockText,
  products,
}: {
  eagerCount: number;
  outOfStockText: string;
  products: ProductCardData[];
}) {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          loading={index < eagerCount ? "eager" : "lazy"}
          product={product}
          outOfStockText={outOfStockText}
          quickShopText="Choose"
        />
      ))}
    </div>
  );
}
