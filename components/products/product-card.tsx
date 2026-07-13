import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/menu-utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/menu";

type ProductCardProps = {
  product: Product;
  onSelect?: (product: Product) => void;
  href?: string;
};

export function ProductCard({ product, onSelect, href }: ProductCardProps) {
  const badgeLabel = product.isPromotional
    ? "Promoção"
    : product.isNew
      ? "Novo"
      : null;
  const content = (
    <>
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg border border-primary/20 bg-secondary sm:h-28 sm:w-32">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          width={160}
          height={120}
          className={cn(
            "h-full w-full object-cover",
            !product.available && "grayscale"
          )}
        />
        {!product.available && (
          <div className="absolute inset-0 bg-white/55" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start gap-2">
          <h2 className="line-clamp-2 flex-1 text-sm font-semibold leading-5 text-foreground">
            {product.name}
          </h2>
          {badgeLabel && (
            <Badge
              variant={product.isPromotional ? "default" : "secondary"}
              className="h-6 shrink-0 rounded-full px-2 text-[11px]"
            >
              {badgeLabel}
            </Badge>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
          {product.shortDescription}
        </p>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {product.promotionalPrice !== undefined ? (
              <>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(product.promotionalPrice)}
                </span>
                {product.price !== null && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          {!product.available && (
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
              Indisponível
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className = cn(
    "flex w-full gap-3 rounded-xl border border-primary/20 bg-card/95 p-3 text-left shadow-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
    product.available ? "hover:border-primary/45 hover:bg-secondary/70" : "opacity-70"
  );

  if (href && !onSelect) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect?.(product)}
      aria-label={`Ver resumo de ${product.name}`}
    >
      {content}
    </button>
  );
}
