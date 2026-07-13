"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MenuSheet } from "@/components/menu/menu-sheet";
import type { Category } from "@/types/menu";

type PublicHeaderProps = {
  establishmentName: string;
  categories: Category[];
  onCategorySelect?: (categoryId: string) => void;
};

export function PublicHeader({
  establishmentName,
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

        <Link
          href="/"
          className="mx-auto flex min-w-0 items-center justify-center gap-2 truncate text-center text-sm font-semibold tracking-wide text-primary outline-none focus-visible:rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Image
            src="/brand/formaggi_logo_vertical.svg"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-full"
            priority
          />
          <span className="truncate">{establishmentName}</span>
        </Link>

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
