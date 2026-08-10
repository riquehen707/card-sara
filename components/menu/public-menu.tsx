"use client";

import Image from "next/image";
import { MessageCircleIcon } from "lucide-react";
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

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PublicMenu({
  establishment,
  categories,
  products,
}: PublicMenuProps) {
  const whatsappUrl = `https://wa.me/55${establishment.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Vim pelo cardápio")}`;
  const [activeCategoryId, setActiveCategoryId] = useState("todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === "todos") {
      return products;
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
        categories={categories}
        onCategorySelect={selectCategory}
      />

      <main className="flex-1 pb-10">
        <section
          className="mx-auto w-full max-w-2xl px-5 py-10 sm:py-12"
          aria-labelledby="restaurant-title"
        >
          <div className="space-y-8">
            <div className="space-y-6">
              <Image
                src="/brand/formaggi_logo_vertical.svg"
                alt="Formaggi"
                width={220}
                height={101}
                className="h-auto w-36 max-w-full"
                priority
              />

              <div className="max-w-xl">
                <h1
                  id="restaurant-title"
                  className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl"
                >
                  {establishment.headline}
                </h1>
                <p
                  id="sobre"
                  className="mt-4 max-w-lg text-base leading-7 text-muted-foreground"
                >
                  {establishment.description}
                </p>
              </div>
            </div>

            <dl
              id="informacoes"
              className="grid gap-5 border-t border-primary/15 pt-6 text-sm sm:grid-cols-2"
            >
              <div className="space-y-1.5">
                <dt className="text-xs font-medium uppercase tracking-[0.16em] text-primary/75">
                  Funcionamento
                </dt>
                <dd className="leading-6 text-foreground">
                  {establishment.hours}
                </dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-xs font-medium uppercase tracking-[0.16em] text-primary/75">
                  Contato
                </dt>
                <dd
                  id="fale-conosco"
                  className="mt-2 flex flex-col items-start gap-2 text-foreground"
                >
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-2 font-medium text-primary outline-none transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    aria-label={`Enviar mensagem para a Formaggi pelo WhatsApp no número ${establishment.phone}`}
                  >
                    <MessageCircleIcon className="size-5" aria-hidden="true" />
                    WhatsApp
                  </a>
                  {establishment.instagram && (
                    <a
                      href={establishment.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <InstagramIcon />
                      Instagram
                    </a>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className="menu-readable space-y-4 px-4"
          aria-labelledby="menu-title"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="menu-title" className="text-lg font-semibold text-primary">
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
              <h3 className="text-sm font-semibold text-primary">
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
