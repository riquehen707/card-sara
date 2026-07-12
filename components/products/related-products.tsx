import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/types/menu";

type RelatedProductsProps = {
  products: Product[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="related-products-title">
      <div>
        <h2
          id="related-products-title"
          className="text-base font-semibold text-foreground"
        >
          Produtos relacionados
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Outras opções da mesma categoria.
        </p>
      </div>
      <div className="grid gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            href={`/produto/${product.slug}`}
          />
        ))}
      </div>
    </section>
  );
}
