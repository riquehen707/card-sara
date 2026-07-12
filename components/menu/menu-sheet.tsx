"use client";

import Link from "next/link";
import { LogInIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Category } from "@/types/menu";

type MenuSheetProps = {
  categories: Category[];
  children: React.ReactNode;
  onCategorySelect?: (categoryId: string) => void;
};

export function MenuSheet({
  categories,
  children,
  onCategorySelect,
}: MenuSheetProps) {
  const [open, setOpen] = useState(false);

  function selectCategory(categoryId: string) {
    onCategorySelect?.(categoryId);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="w-[86%] max-w-sm gap-0 p-0">
        <SheetHeader className="border-b px-5 py-5 text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Escolha uma seção do cardápio.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          <div className="grid gap-1">
            <button
              type="button"
              onClick={() => selectCategory("todos")}
              className="flex min-h-11 items-center rounded-lg px-3 text-left text-sm font-medium text-foreground outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Início
            </button>
            <Link
              href="/#categorias"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Categorias
            </Link>
          </div>

          <div className="grid gap-1" aria-label="Categorias principais">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className="flex min-h-11 items-center rounded-lg px-3 text-left text-sm text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid gap-1 border-t pt-5">
            <Link
              href="/#informacoes"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Informações
            </Link>
            <a
              href="#fale-conosco"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Fale conosco
            </a>
            <a
              href="#sobre"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Sobre o restaurante
            </a>
          </div>

          <Button asChild variant="outline" className="mt-auto justify-start">
            <Link href="/admin" onClick={() => setOpen(false)}>
              <LogInIcon className="size-4" aria-hidden="true" />
              Acesso administrativo
            </Link>
          </Button>
        </div>

        <div className="sr-only">
          {categories.map((category) => category.name).join(", ")}
        </div>
      </SheetContent>
    </Sheet>
  );
}
