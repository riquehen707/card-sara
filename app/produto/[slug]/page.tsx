import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { RelatedProducts } from "@/components/products/related-products";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  getCategoryName,
  getRelatedProducts,
} from "@/lib/menu-utils";
import { products } from "@/lib/menu-data";

type ProductDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product);

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
          <p className="truncate text-center text-sm font-semibold">
            Detalhes do produto
          </p>
          <span aria-hidden="true" />
        </div>
      </header>

      <main className="menu-readable flex-1 px-4 pb-10">
        <article className="space-y-5 py-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-secondary">
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              priority
              sizes="(min-width: 768px) 480px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {getCategoryName(product.categoryId)}
            </p>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold leading-8 text-foreground">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xl font-semibold text-foreground">
                  {formatCurrency(product.promotionalPrice ?? product.price)}
                </span>
                {product.promotionalPrice !== undefined &&
                  product.price !== null && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>
            {!product.available && (
              <p className="rounded-lg border bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground">
                Produto indisponível no momento.
              </p>
            )}
          </div>

          <Separator />

          <section className="space-y-2" aria-labelledby="description-title">
            <h2 id="description-title" className="text-base font-semibold">
              Descrição
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>
          </section>

          <section className="space-y-2" aria-labelledby="portion-title">
            <h2 id="portion-title" className="text-base font-semibold">
              Porção
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {product.portion}
            </p>
          </section>

          {product.accompaniments && product.accompaniments.length > 0 && (
            <section
              className="space-y-2"
              aria-labelledby="accompaniments-title"
            >
              <h2 id="accompaniments-title" className="text-base font-semibold">
                Acompanhamentos
              </h2>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {product.accompaniments.map((accompaniment) => (
                  <li
                    key={accompaniment.id}
                    className="flex min-h-11 items-center justify-between rounded-lg border px-3"
                  >
                    <span>{accompaniment.name}</span>
                    {accompaniment.included && (
                      <span className="text-xs font-medium text-foreground">
                        Incluso
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2" aria-labelledby="notes-title">
            <h2 id="notes-title" className="text-base font-semibold">
              Observações
            </h2>
            <p className="rounded-xl border bg-secondary/70 px-3 py-3 text-sm leading-6 text-muted-foreground">
              {product.notes ??
                "Informe preferências e restrições diretamente no atendimento."}
            </p>
          </section>

          <RelatedProducts products={relatedProducts} />

          <Button asChild variant="outline" className="w-full">
            <Link href="/">Voltar ao cardápio</Link>
          </Button>
        </article>
      </main>
    </>
  );
}
