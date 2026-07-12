"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCurrency } from "@/lib/menu-utils";
import type { Product } from "@/types/menu";

type ProductQuickViewProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function QuickViewContent({ product }: { product: Product }) {
  return (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          sizes="(min-width: 768px) 360px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold leading-7 text-foreground">
            {product.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.portion}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(product.promotionalPrice ?? product.price)}
          </span>
          {product.promotionalPrice !== undefined && product.price !== null && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {product.shortDescription}
        </p>
      </div>
    </>
  );
}

export function ProductQuickView({
  product,
  open,
  onOpenChange,
}: ProductQuickViewProps) {
  const isDesktop = useIsDesktop();

  if (!product) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="sr-only">{product.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização rápida do produto.
            </DialogDescription>
          </DialogHeader>
          <QuickViewContent product={product} />
          <DialogFooter>
            <Button asChild className="w-full">
              <Link href={`/produto/${product.slug}`}>Ver detalhes</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{product.name}</DrawerTitle>
          <DrawerDescription>Visualização rápida do produto.</DrawerDescription>
        </DrawerHeader>
        <div className="mx-auto grid w-full max-w-[480px] gap-4 px-4 py-5">
          <QuickViewContent product={product} />
        </div>
        <DrawerFooter className="mx-auto w-full max-w-[480px] px-4 pb-5 pt-0">
          <Button asChild className="w-full">
            <Link href={`/produto/${product.slug}`}>Ver detalhes</Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
