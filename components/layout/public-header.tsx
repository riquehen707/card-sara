"use client";

import Link from "next/link";
import { MenuIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MenuSheet } from "@/components/menu/menu-sheet";
import type { Category } from "@/types/menu";

type PublicHeaderProps = {
  categories: Category[];
  onCategorySelect?: (categoryId: string) => void;
};

export function PublicHeader({
  categories,
  onCategorySelect,
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-primary/25 bg-background">
      <div className="menu-readable grid h-16 grid-cols-[44px_1fr_44px] items-center gap-2 px-4">
        <MenuSheet
          categories={categories}
          onCategorySelect={onCategorySelect}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            className="rounded-full"
          >
            <MenuIcon className="size-5" aria-hidden="true" />
          </Button>
        </MenuSheet>

        <div aria-hidden="true" />

        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Buscar produtos"
          className="rounded-full"
        >
          <Link href="/busca">
            <SearchIcon className="size-5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
