"use client";

import type { Category, HighlightType, Product } from "@/types/menu";
import { ProductList } from "@/components/products/product-list";

type MenuHighlightsProps = {
  categories: Category[];
  products: Product[];
  onProductSelect: (product: Product) => void;
};

const highlightLabels: Record<HighlightType, string> = {
  recommended: "Recomendados",
  new: "Lançamentos",
  promotion: "Promoções",
  featured: "Destaques",
};

const highlightOrder: HighlightType[] = [
  "recommended",
  "new",
  "promotion",
  "featured",
];

function getProductHighlightType(product: Product): HighlightType | undefined {
  if (product.highlightType) return product.highlightType;
  if (product.isPromotional) return "promotion";
  if (product.isNew) return "new";
  return undefined;
}

export function MenuHighlights({
  categories,
  products,
  onProductSelect,
}: MenuHighlightsProps) {
  const availableProducts = products.filter((product) => product.available);
  const featuredCategoryById = new Map(
    categories
      .filter((category) => category.highlightType)
      .map((category) => [category.id, category.highlightType] as const)
  );
  const productsByType = new Map<HighlightType, Product[]>(
    highlightOrder.map((type) => [type, []])
  );

  for (const product of availableProducts) {
    const type = getProductHighlightType(product) ?? featuredCategoryById.get(product.categoryId);

    if (type) {
      productsByType.get(type)?.push(product);
    }
  }

  const groups = highlightOrder
    .map((type) => ({ type, products: productsByType.get(type) ?? [] }))
    .filter((group) => group.products.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="menu-readable space-y-5 px-4 pb-2" aria-labelledby="highlights-title">
      <div>
        <h2 id="highlights-title" className="text-lg font-semibold text-primary">
          Destaques
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Seleções especiais para aproveitar hoje.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.type} className="space-y-3" aria-labelledby={`highlight-${group.type}`}>
          <h3 id={`highlight-${group.type}`} className="text-sm font-semibold text-foreground">
            {highlightLabels[group.type]}
          </h3>
          <ProductList products={group.products} onProductSelect={onProductSelect} />
        </section>
      ))}
    </section>
  );
}
