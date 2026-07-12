"use client";

import { useMemo, useState } from "react";

import { PublicHeader } from "@/components/layout/public-header";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { ProductList } from "@/components/products/product-list";
import { ProductQuickView } from "@/components/products/product-quick-view";
import type { Category, Establishment, Product } from "@/types/menu";

type PublicMenuProps = {
  establishment: Establishment;
  categories: Category[];
  products: Product[];
};

export function PublicMenu({
  establishment,
  categories,
  products,
}: PublicMenuProps) {
  const [activeCategoryId, setActiveCategoryId] = useState("todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === "todos") {
      return products;
    }

    if (activeCategoryId === "promocoes") {
      return products.filter((product) => product.isPromotional);
    }

    if (activeCategoryId === "novidades") {
      return products.filter((product) => product.isNew);
    }

    return products.filter((product) => product.categoryId === activeCategoryId);
  }, [activeCategoryId, products]);

  const activeCategoryName =
    activeCategoryId === "todos"
      ? "Todos os produtos"
      : categories.find((category) => category.id === activeCategoryId)?.name ??
        "Produtos";

  function selectCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    window.requestAnimationFrame(() => {
      document.getElementById("produtos")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function openQuickView(product: Product) {
    setSelectedProduct(product);
    setQuickViewOpen(true);
  }

  function handleQuickViewChange(open: boolean) {
    setQuickViewOpen(open);
    if (!open) {
      window.setTimeout(() => setSelectedProduct(null), 180);
    }
  }

  return (
    <>
      <PublicHeader
        establishmentName={establishment.name}
        categories={categories}
        onCategorySelect={selectCategory}
      />

      <main className="menu-readable flex-1 px-4 pb-10">
        <section className="py-5" aria-labelledby="restaurant-title">
          <div className="rounded-xl border bg-card p-4 shadow-xs">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Aberto hoje
            </p>
            <h1
              id="restaurant-title"
              className="mt-2 text-2xl font-semibold leading-8 text-foreground"
            >
              {establishment.headline}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {establishment.description}
            </p>
            <dl
              id="informacoes"
              className="mt-4 grid gap-2 border-t pt-4 text-sm"
            >
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Horário</dt>
                <dd className="text-right font-medium text-foreground">
                  {establishment.hours}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Contato</dt>
                <dd id="fale-conosco" className="font-medium text-foreground">
                  {establishment.phone}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Endereço</dt>
                <dd id="sobre" className="text-right font-medium text-foreground">
                  {establishment.address}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="menu-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="menu-title" className="text-lg font-semibold">
                Cardápio
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Toque em um item para ver um resumo.
              </p>
            </div>
          </div>

          <CategoryTabs
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelect={selectCategory}
          />

          <div id="produtos" className="scroll-mt-20 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {activeCategoryName}
              </h3>
              <span className="text-xs text-muted-foreground">
                {filteredProducts.length} itens
              </span>
            </div>
            <ProductList
              products={filteredProducts}
              onProductSelect={openQuickView}
            />
          </div>
        </section>
      </main>

      <ProductQuickView
        product={selectedProduct}
        open={quickViewOpen}
        onOpenChange={handleQuickViewChange}
      />
    </>
  );
}
