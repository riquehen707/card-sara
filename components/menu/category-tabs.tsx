"use client";

import type { Category } from "@/types/menu";
import { cn } from "@/lib/utils";

type CategoryTabsProps = {
  categories: Category[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
};

export function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryTabsProps) {
  const tabs = [{ id: "todos", name: "Todos" }, ...categories];

  return (
    <nav
      id="categorias"
      aria-label="Categorias do cardápio"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max gap-2 py-1">
        {tabs.map((category) => {
          const isActive = category.id === activeCategoryId;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                "inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-primary/25 bg-card text-muted-foreground hover:border-primary/60 hover:bg-secondary hover:text-foreground"
              )}
              aria-pressed={isActive}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
