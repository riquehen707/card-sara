"use client";

import Link from "next/link";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ProductList } from "@/components/products/product-list";
import { ProductQuickView } from "@/components/products/product-quick-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types/menu";

type SearchProductsProps = {
  products: Product[];
};

export function SearchProducts({ products }: SearchProductsProps) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.shortDescription,
        product.description,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [products, query]);

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
      <header className="sticky top-0 z-30 border-b bg-background/95">
        <div className="menu-readable grid h-14 grid-cols-[44px_1fr_44px] items-center gap-2 px-4">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Voltar ao cardápio"
            className="rounded-full"
          >
            <Link href="/">
              <ArrowLeftIcon className="size-5" aria-hidden="true" />
            </Link>
          </Button>
          <h1 className="truncate text-center text-sm font-semibold">
            Buscar produtos
          </h1>
          <span aria-hidden="true" />
        </div>
      </header>

      <main className="menu-readable flex-1 px-4 py-5">
        <section className="space-y-4" aria-label="Busca de produtos">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite o nome do produto"
              aria-label="Buscar por nome ou descrição"
              className="h-12 rounded-xl pl-10 text-base"
              autoFocus
            />
          </div>

          {!query.trim() ? (
            <EmptyState
              title="Busque um item do cardápio"
              description="Digite parte do nome ou da descrição para filtrar os produtos."
            />
          ) : results.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description="Não encontramos produtos para essa busca. Tente outro termo."
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {results.length} resultado{results.length > 1 ? "s" : ""}
              </p>
              <ProductList products={results} onProductSelect={openQuickView} />
            </div>
          )}
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
