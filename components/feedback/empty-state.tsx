import { SearchXIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-secondary/60 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-full border bg-background text-muted-foreground">
        <SearchXIcon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
