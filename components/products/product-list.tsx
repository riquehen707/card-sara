import { EmptyState } from "@/components/feedback/empty-state";
import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/types/menu";

type ProductListProps = {
  products: Product[];
  onProductSelect?: (product: Product) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProductList({
  products,
  onProductSelect,
  emptyTitle = "Nenhum produto encontrado",
  emptyDescription = "Tente selecionar outra categoria ou buscar por outro termo.",
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="grid gap-3" aria-label="Lista de produtos">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onProductSelect}
        />
      ))}
    </div>
  );
}
