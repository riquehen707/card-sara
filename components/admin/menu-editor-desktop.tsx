"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  LogOutIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/menu-utils";
import { cn } from "@/lib/utils";
import type { Category, MenuData, Product, ProductAccompaniment } from "@/types/menu";
import { menuDataSchema } from "@/types/menu";

type MenuEditorDesktopProps = {
  initialMenuData: MenuData;
};

type ProductDraft = Product & {
  removed?: boolean;
};

type DraftMenuData = Omit<MenuData, "products"> & {
  products: ProductDraft[];
};

type PriceErrors = Record<string, string | undefined>;

type NewProductForm = {
  name: string;
  description: string;
  categoryId: string;
  price: string;
};

type ProductStatusFilter = "todos" | "alterados" | "indisponiveis";

const draftStorageKey = "cardapio-sara-admin-draft-v1";
const publishTokenStorageKey = "cardapio-sara-admin-publish-token";
const adminSessionStorageKey = "cardapio-sara-admin-session";
const placeholderImageUrl = "/mock/placeholder.svg";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function createSlug(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function parsePriceInput(
  value: string,
  options: { allowEmpty?: boolean } = {}
): { value: number | null; error?: never } | { value?: never; error: string } {
  const normalizedValue = value.trim().replace(",", ".");

  if (!normalizedValue) {
    if (options.allowEmpty) {
      return { value: null };
    }

    return { error: "Informe um valor." };
  }

  const price = Number(normalizedValue);

  if (!Number.isFinite(price)) {
    return { error: "Use um preço válido." };
  }

  if (price < 0) {
    return { error: "O preço não pode ser negativo." };
  }

  return { value: Number(price.toFixed(2)) };
}

function formatPriceInput(value: number | null) {
  if (value === null) {
    return "";
  }

  return value.toFixed(2).replace(".", ",");
}

function createInitialDraft(menuData: MenuData): DraftMenuData {
  return {
    ...menuData,
    products: menuData.products.map((product) => ({ ...product })),
  };
}

function productFingerprint(product: ProductDraft | Product) {
  return JSON.stringify(product);
}

function getProductChangeState(product: ProductDraft, original?: Product) {
  if (product.removed) return "removed";
  if (!original) return "added";

  return productFingerprint(product) === productFingerprint(original)
    ? "unchanged"
    : "changed";
}

function countChanges(products: ProductDraft[], originalProducts: Product[]) {
  const originalById = new Map(
    originalProducts.map((product) => [product.id, product])
  );

  return products.reduce((total, product) => {
    const original = originalById.get(product.id);
    const state = getProductChangeState(product, original);
    return state === "unchanged" ? total : total + 1;
  }, 0);
}

function buildPublishMenuData(draft: DraftMenuData): MenuData {
  return {
    establishment: draft.establishment,
    categories: draft.categories,
    products: draft.products
      .filter((product) => !product.removed)
      .map((product) => {
        const publishProduct: ProductDraft = { ...product };
        delete publishProduct.removed;
        return publishProduct;
      }),
  };
}

function getCategoryOrder(categories: Category[], categoryId: string) {
  return (
    categories.find((category) => category.id === categoryId)?.order ??
    Number.MAX_SAFE_INTEGER
  );
}

function getDraftFingerprint(menuData: MenuData) {
  return JSON.stringify(menuData);
}

function getStoredDraft(
  initialMenuData: MenuData,
  initialFingerprint: string
) {
  if (typeof window === "undefined") {
    return createInitialDraft(initialMenuData);
  }

  const storedDraft = window.localStorage.getItem(draftStorageKey);

  if (!storedDraft) {
    return createInitialDraft(initialMenuData);
  }

  try {
    const parsedDraft = JSON.parse(storedDraft) as {
      baseFingerprint?: string;
      draft?: DraftMenuData;
    };

    if (
      parsedDraft.baseFingerprint === initialFingerprint &&
      parsedDraft.draft
    ) {
      return parsedDraft.draft;
    }
  } catch {
    window.localStorage.removeItem(draftStorageKey);
  }

  return createInitialDraft(initialMenuData);
}

function createPriceInputs(products: ProductDraft[]) {
  return Object.fromEntries(
    products.map((product) => [product.id, formatPriceInput(product.price)])
  );
}

function getStoredPublishToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(publishTokenStorageKey) ?? "";
}

function createUniqueProductId(base: string, products: ProductDraft[]) {
  const normalizedBase = createSlug(base) || "produto";
  const existingIds = new Set(products.map((product) => product.id));
  let id = normalizedBase;
  let suffix = 2;

  while (existingIds.has(id)) {
    id = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function createUniqueSlug(base: string, products: ProductDraft[]) {
  const normalizedBase = createSlug(base) || "produto";
  const existingSlugs = new Set(products.map((product) => product.slug));
  let slug = normalizedBase;
  let suffix = 2;

  while (existingSlugs.has(slug)) {
    slug = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function formatAccompanimentsInput(accompaniments?: ProductAccompaniment[]) {
  return accompaniments?.map((accompaniment) => accompaniment.name).join("\n") ?? "";
}

function parseAccompanimentsInput(
  productId: string,
  value: string
): ProductAccompaniment[] | undefined {
  const names = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return undefined;
  }

  return names.map((name, index) => ({
    id: `${productId}-acompanhamento-${index + 1}`,
    name,
    included: true,
  }));
}

function getStatusLabel(status: string) {
  if (status === "added") return "Novo";
  if (status === "changed") return "Alterado";
  if (status === "removed") return "Removido";
  return "Publicado";
}

export function MenuEditorDesktop({
  initialMenuData,
}: MenuEditorDesktopProps) {
  const initialFingerprint = getDraftFingerprint(initialMenuData);
  const initialDraft = getStoredDraft(initialMenuData, initialFingerprint);
  const [draft, setDraft] = useState<DraftMenuData>(() => initialDraft);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("todos");
  const [statusFilter, setStatusFilter] =
    useState<ProductStatusFilter>("todos");
  const [selectedProductId, setSelectedProductId] = useState(
    initialDraft.products[0]?.id ?? ""
  );
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(() =>
    createPriceInputs(initialDraft.products)
  );
  const [priceErrors, setPriceErrors] = useState<PriceErrors>({});
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    description: "",
    categoryId: initialMenuData.categories[0]?.id ?? "",
    price: "",
  });
  const [publishToken, setPublishToken] = useState(getStoredPublishToken);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const originalProductsById = useMemo(
    () =>
      new Map(initialMenuData.products.map((product) => [product.id, product])),
    [initialMenuData.products]
  );

  useEffect(() => {
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        baseFingerprint: initialFingerprint,
        draft,
      })
    );
  }, [draft, initialFingerprint]);

  const categoryCounts = useMemo(() => {
    return new Map(
      draft.categories.map((category) => [
        category.id,
        draft.products.filter(
          (product) => product.categoryId === category.id && !product.removed
        ).length,
      ])
    );
  }, [draft.categories, draft.products]);

  const changedProductIds = useMemo(() => {
    return new Set(
      draft.products
        .filter((product) => {
          const original = originalProductsById.get(product.id);
          return getProductChangeState(product, original) !== "unchanged";
        })
        .map((product) => product.id)
    );
  }, [draft.products, originalProductsById]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return draft.products
      .filter((product) => {
        if (categoryId !== "todos" && product.categoryId !== categoryId) {
          return false;
        }

        if (statusFilter === "alterados" && !changedProductIds.has(product.id)) {
          return false;
        }

        if (statusFilter === "indisponiveis" && product.available) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchableText = normalizeText(
          `${product.name} ${product.description} ${product.shortDescription}`
        );

        return searchableText.includes(normalizedQuery);
      })
      .sort((firstProduct, secondProduct) => {
        const categoryDifference =
          getCategoryOrder(draft.categories, firstProduct.categoryId) -
          getCategoryOrder(draft.categories, secondProduct.categoryId);

        if (categoryDifference !== 0) {
          return categoryDifference;
        }

        return (firstProduct.order ?? 9999) - (secondProduct.order ?? 9999);
      });
  }, [
    categoryId,
    changedProductIds,
    draft.categories,
    draft.products,
    query,
    statusFilter,
  ]);

  const selectedProduct =
    draft.products.find((product) => product.id === selectedProductId) ??
    visibleProducts[0] ??
    draft.products[0];

  const selectedOriginal = selectedProduct
    ? originalProductsById.get(selectedProduct.id)
    : undefined;
  const selectedState = selectedProduct
    ? getProductChangeState(selectedProduct, selectedOriginal)
    : "unchanged";
  const changeCount = countChanges(draft.products, initialMenuData.products);
  const hasPriceErrors = Object.values(priceErrors).some(Boolean);
  const unavailableCount = draft.products.filter(
    (product) => !product.available && !product.removed
  ).length;

  function updateProduct(
    productId: string,
    updater: (product: ProductDraft) => ProductDraft
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      products: currentDraft.products.map((product) =>
        product.id === productId ? updater(product) : product
      ),
    }));
    setPublishMessage(null);
  }

  function updatePrice(productId: string, value: string) {
    setPriceInputs((currentInputs) => ({
      ...currentInputs,
      [productId]: value,
    }));

    const parsedPrice = parsePriceInput(value, { allowEmpty: true });

    if ("error" in parsedPrice) {
      setPriceErrors((currentErrors) => ({
        ...currentErrors,
        [productId]: parsedPrice.error,
      }));
      return;
    }

    setPriceErrors((currentErrors) => ({
      ...currentErrors,
      [productId]: undefined,
    }));

    updateProduct(productId, (product) => ({
      ...product,
      price: parsedPrice.value,
    }));
  }

  function undoProduct(productId: string) {
    const originalProduct = originalProductsById.get(productId);

    setDraft((currentDraft) => ({
      ...currentDraft,
      products: originalProduct
        ? currentDraft.products.map((product) =>
            product.id === productId ? { ...originalProduct } : product
          )
        : currentDraft.products.filter((product) => product.id !== productId),
    }));

    setPriceInputs((currentInputs) => {
      const nextInputs = { ...currentInputs };

      if (originalProduct) {
        nextInputs[productId] = formatPriceInput(originalProduct.price);
      } else {
        delete nextInputs[productId];
      }

      return nextInputs;
    });
    setPriceErrors((currentErrors) => ({
      ...currentErrors,
      [productId]: undefined,
    }));
    setPublishMessage(null);
  }

  function discardChanges() {
    const nextDraft = createInitialDraft(initialMenuData);
    setDraft(nextDraft);
    setPriceInputs(createPriceInputs(nextDraft.products));
    setPriceErrors({});
    setSelectedProductId(nextDraft.products[0]?.id ?? "");
    window.localStorage.removeItem(draftStorageKey);
    setPublishMessage("Alterações descartadas.");
  }

  function addProduct() {
    const parsedPrice = parsePriceInput(newProduct.price);

    if ("error" in parsedPrice || !newProduct.name.trim()) {
      setPublishMessage(
        "Preencha nome e preço válido antes de adicionar o produto."
      );
      return;
    }

    const id = createUniqueProductId(newProduct.name, draft.products);
    const slug = createUniqueSlug(newProduct.name, draft.products);
    const description = newProduct.description.trim() || newProduct.name.trim();
    const categoryProducts = draft.products.filter(
      (product) => product.categoryId === newProduct.categoryId
    );
    const product: ProductDraft = {
      id,
      slug,
      name: newProduct.name.trim(),
      categoryId: newProduct.categoryId,
      order:
        Math.max(0, ...categoryProducts.map((product) => product.order ?? 0)) +
        1,
      shortDescription: description,
      description,
      price: parsedPrice.value,
      portion: "Porção",
      imageUrl: placeholderImageUrl,
      imageAlt: newProduct.name.trim(),
      available: true,
    };

    setDraft((currentDraft) => ({
      ...currentDraft,
      products: [...currentDraft.products, product],
    }));
    setPriceInputs((currentInputs) => ({
      ...currentInputs,
      [id]: formatPriceInput(product.price),
    }));
    setSelectedProductId(id);
    setNewProduct({
      name: "",
      description: "",
      categoryId: initialMenuData.categories[0]?.id ?? "",
      price: "",
    });
    setNewProductOpen(false);
    setPublishMessage(null);
  }

  function duplicateProduct(product: ProductDraft) {
    const name = `${product.name} cópia`;
    const id = createUniqueProductId(name, draft.products);
    const slug = createUniqueSlug(name, draft.products);
    const categoryProducts = draft.products.filter(
      (draftProduct) => draftProduct.categoryId === product.categoryId
    );
    const duplicatedProduct: ProductDraft = {
      ...product,
      id,
      slug,
      name,
      imageAlt: name,
      order:
        Math.max(0, ...categoryProducts.map((draftProduct) => draftProduct.order ?? 0)) +
        1,
      removed: false,
      accompaniments: product.accompaniments?.map((accompaniment, index) => ({
        ...accompaniment,
        id: `${id}-acompanhamento-${index + 1}`,
      })),
    };

    setDraft((currentDraft) => ({
      ...currentDraft,
      products: [...currentDraft.products, duplicatedProduct],
    }));
    setPriceInputs((currentInputs) => ({
      ...currentInputs,
      [id]: formatPriceInput(duplicatedProduct.price),
    }));
    setSelectedProductId(id);
    setPublishMessage(null);
  }

  function logout() {
    window.sessionStorage.removeItem(adminSessionStorageKey);
    window.location.reload();
  }

  async function publishChanges() {
    const publishMenuData = buildPublishMenuData(draft);
    const parsedMenuData = menuDataSchema.safeParse(publishMenuData);

    if (!parsedMenuData.success) {
      setPublishMessage("Existem dados inválidos no cardápio.");
      return;
    }

    setPublishing(true);
    setPublishMessage(null);
    window.sessionStorage.setItem(publishTokenStorageKey, publishToken);

    try {
      const response = await fetch("/api/admin/menu/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(publishToken
            ? { "x-admin-publish-token": publishToken }
            : {}),
        },
        body: JSON.stringify({ menuData: parsedMenuData.data }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível publicar.");
      }

      window.localStorage.removeItem(draftStorageKey);
      setPublishMessage(data.message ?? "Alterações publicadas.");
    } catch (error) {
      setPublishMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao publicar alterações."
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="min-h-dvh bg-secondary/30">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex min-h-20 w-full max-w-[1500px] items-center justify-between gap-6 px-6 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Voltar ao cardápio"
            >
              <Link href="/">
                <ArrowLeftIcon className="size-5" aria-hidden="true" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Administração
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Formaggi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "hidden items-center gap-2 rounded-full border px-3 py-2 text-sm md:flex",
                changeCount > 0
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  changeCount > 0 ? "bg-primary" : "bg-muted-foreground"
                )}
                aria-hidden="true"
              />
              {changeCount > 0
                ? `${changeCount} pendente${changeCount === 1 ? "" : "s"}`
                : "Tudo publicado"}
            </div>
            <Input
              type="password"
              value={publishToken}
              onChange={(event) => setPublishToken(event.target.value)}
              placeholder="Chave"
              aria-label="Chave de publicação"
              className="h-10 w-28 md:w-40"
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  disabled={changeCount === 0 || hasPriceErrors || publishing}
                >
                  <SaveIcon className="size-4" aria-hidden="true" />
                  Publicar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Publicar alterações no cardápio?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {changeCount === 1
                      ? "1 alteração será publicada de uma vez."
                      : `${changeCount} alterações serão publicadas de uma vez.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={publishChanges}>
                    <CheckIcon className="size-4" aria-hidden="true" />
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              variant="ghost"
              onClick={discardChanges}
              disabled={changeCount === 0 || publishing}
            >
              Descartar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>
              <LogOutIcon className="size-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] gap-5 px-6 py-5 xl:grid-cols-[260px_minmax(0,1fr)_400px]">
        <aside className="xl:sticky xl:top-[100px] xl:self-start">
          <section className="rounded-xl border bg-card p-4 shadow-xs">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Categorias</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha uma seção.
              </p>
            </div>
            <div className="grid gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryId("todos")}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-lg px-3 text-left text-sm outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  categoryId === "todos" && "bg-secondary font-medium"
                )}
              >
                <span>Todos</span>
                <span className="text-xs text-muted-foreground">
                  {draft.products.filter((product) => !product.removed).length}
                </span>
              </button>
              {draft.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-lg px-3 text-left text-sm outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    categoryId === category.id && "bg-secondary font-medium"
                  )}
                >
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {categoryCounts.get(category.id) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </section>

        </aside>

        <section className="grid min-w-0 gap-4">
          <section className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Produtos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Busque, altere preços e controle a disponibilidade.
                </p>
              </div>
              <Button size="lg" onClick={() => setNewProductOpen(true)}>
                <PlusIcon className="size-4" aria-hidden="true" />
                Adicionar produto
              </Button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="relative">
                <SearchIcon
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar produto pelo nome ou descrição"
                  className="h-14 rounded-xl pl-12 text-base"
                  aria-label="Buscar produto"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["todos", "Todos", draft.products.length],
                  ["alterados", "Alterados", changedProductIds.size],
                  ["indisponiveis", "Indisponíveis", unavailableCount],
                ].map(([value, label, count]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={statusFilter === value ? "secondary" : "ghost"}
                    className="h-9 rounded-full px-3"
                    onClick={() => setStatusFilter(value as ProductStatusFilter)}
                  >
                    <span>{label}</span>
                    <Badge variant="outline">{count}</Badge>
                  </Button>
                ))}
              </div>
              {publishMessage && (
                <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
                  {publishMessage}
                </p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="max-h-[calc(100dvh-285px)] min-h-[500px] overflow-auto">
              <table className="w-full min-w-[640px] text-base">
                <thead className="sticky top-0 z-10 border-b bg-secondary/95 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium">
                      Produto
                    </th>
                    <th className="w-44 px-5 py-4 text-left font-medium">
                      Preço
                    </th>
                    <th className="w-36 px-5 py-4 text-left font-medium">
                      Disponível
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-14 text-center text-sm text-muted-foreground"
                      >
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  ) : (
                    visibleProducts.map((product) => {
                      const originalProduct = originalProductsById.get(
                        product.id
                      );
                      const changeState = getProductChangeState(
                        product,
                        originalProduct
                      );
                      const priceError = priceErrors[product.id];
                      const isSelected = product.id === selectedProduct?.id;

                      return (
                        <tr
                          key={product.id}
                          className={cn(
                            "border-b last:border-b-0",
                            isSelected && "bg-secondary/70",
                            product.removed && "opacity-55"
                          )}
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedProductId(product.id)}
                              className="grid w-full gap-1 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                              <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                                {changeState !== "unchanged" && (
                                  <span
                                    className="size-2.5 rounded-full bg-primary"
                                    aria-label={`${getStatusLabel(changeState)} não publicado`}
                                  />
                                )}
                                <span>{product.name}</span>
                              </span>
                              <span className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                                {product.description}
                              </span>
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <Input
                              inputMode="decimal"
                              value={priceInputs[product.id] ?? ""}
                              onChange={(event) =>
                                updatePrice(product.id, event.target.value)
                              }
                              aria-label={`Preço de ${product.name}`}
                              aria-invalid={Boolean(priceError)}
                              disabled={product.removed}
                              className="h-11 text-base"
                            />
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                priceError
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              )}
                            >
                              {priceError ?? formatCurrency(product.price)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={product.available}
                                onCheckedChange={(checked) =>
                                  updateProduct(product.id, (currentProduct) => ({
                                    ...currentProduct,
                                    available: checked,
                                  }))
                                }
                                aria-label={`Disponibilidade de ${product.name}`}
                                disabled={product.removed}
                              />
                              <span className="text-xs text-muted-foreground">
                                {product.available ? "Sim" : "Não"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <aside className="grid gap-4 xl:sticky xl:top-[100px] xl:self-start">
          {selectedProduct ? (
            <section className="rounded-xl border bg-card p-6 shadow-xs">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Detalhes
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {selectedProduct.name}
                  </h2>
                </div>
                <Badge variant="outline">{getStatusLabel(selectedState)}</Badge>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-3 border-b pb-6">
                  <Label htmlFor="selected-product-name">Nome</Label>
                  <Input
                    id="selected-product-name"
                    value={selectedProduct.name}
                    onChange={(event) =>
                      updateProduct(selectedProduct.id, (product) => ({
                        ...product,
                        name: event.target.value,
                        imageAlt: event.target.value,
                      }))
                    }
                    disabled={selectedProduct.removed}
                    className="h-12 border-transparent bg-secondary/40 text-base"
                  />
                </div>

                <div className="grid gap-3 border-b pb-6">
                  <Label htmlFor="selected-product-category">Categoria</Label>
                  <Select
                    value={selectedProduct.categoryId}
                    onValueChange={(value) =>
                      updateProduct(selectedProduct.id, (product) => ({
                        ...product,
                        categoryId: value,
                      }))
                    }
                    disabled={selectedProduct.removed}
                  >
                    <SelectTrigger
                      id="selected-product-category"
                      className="h-12 border-transparent bg-secondary/40 text-base"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {draft.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b pb-6">
                  <div className="grid gap-3">
                    <Label htmlFor="selected-product-price">Preço</Label>
                    <Input
                      id="selected-product-price"
                      inputMode="decimal"
                      value={priceInputs[selectedProduct.id] ?? ""}
                      onChange={(event) =>
                        updatePrice(selectedProduct.id, event.target.value)
                      }
                      disabled={selectedProduct.removed}
                      className="h-12 border-transparent bg-secondary/40 text-base"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="selected-product-portion">Porção</Label>
                    <Input
                      id="selected-product-portion"
                      value={selectedProduct.portion}
                      onChange={(event) =>
                        updateProduct(selectedProduct.id, (product) => ({
                          ...product,
                          portion: event.target.value,
                        }))
                      }
                      disabled={selectedProduct.removed}
                      className="h-12 border-transparent bg-secondary/40 text-base"
                    />
                  </div>
                </div>

                <div className="grid gap-3 border-b pb-6">
                  <Label htmlFor="selected-product-description">Descrição</Label>
                  <Textarea
                    id="selected-product-description"
                    value={selectedProduct.description}
                    onChange={(event) =>
                      updateProduct(selectedProduct.id, (product) => ({
                        ...product,
                        description: event.target.value,
                        shortDescription: event.target.value,
                      }))
                    }
                    className="min-h-32 resize-none border-transparent bg-secondary/40 text-base leading-6"
                    disabled={selectedProduct.removed}
                  />
                </div>

                <div className="grid gap-3 border-b pb-6">
                  <Label htmlFor="selected-product-accompaniments">
                    Acompanhamentos
                  </Label>
                  <Textarea
                    id="selected-product-accompaniments"
                    value={formatAccompanimentsInput(
                      selectedProduct.accompaniments
                    )}
                    onChange={(event) =>
                      updateProduct(selectedProduct.id, (product) => ({
                        ...product,
                        accompaniments: parseAccompanimentsInput(
                          selectedProduct.id,
                          event.target.value
                        ),
                      }))
                    }
                    className="min-h-28 resize-none border-transparent bg-secondary/40 text-base leading-6"
                    placeholder={"Um acompanhamento por linha"}
                    disabled={selectedProduct.removed}
                  />
                </div>

                <div className="flex min-h-14 items-center justify-between rounded-xl bg-secondary/40 px-4">
                  <Label htmlFor="selected-product-available">Disponível</Label>
                  <Switch
                    id="selected-product-available"
                    checked={selectedProduct.available}
                    onCheckedChange={(checked) =>
                      updateProduct(selectedProduct.id, (product) => ({
                        ...product,
                        available: checked,
                      }))
                    }
                    disabled={selectedProduct.removed}
                  />
                </div>

                {selectedState !== "unchanged" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => undoProduct(selectedProduct.id)}
                  >
                    <RotateCcwIcon className="size-4" aria-hidden="true" />
                    Desfazer alterações deste produto
                  </Button>
                )}

                <div className="mt-2 grid gap-3 border-t pt-6">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Ações secundárias
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => duplicateProduct(selectedProduct)}
                  >
                    <CopyIcon className="size-4" aria-hidden="true" />
                    Duplicar
                  </Button>
                  <Button
                    type="button"
                    variant={selectedProduct.removed ? "secondary" : "outline"}
                    onClick={() =>
                      updateProduct(selectedProduct.id, (product) => ({
                        ...product,
                        removed: !product.removed,
                      }))
                    }
                  >
                    <Trash2Icon className="size-4" aria-hidden="true" />
                    {selectedProduct.removed ? "Restaurar" : "Remover"}
                  </Button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              Selecione um produto para editar detalhes.
            </section>
          )}
        </aside>
      </main>

      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar produto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-product-name">Nome</Label>
              <Input
                id="new-product-name"
                value={newProduct.name}
                onChange={(event) =>
                  setNewProduct((currentProduct) => ({
                    ...currentProduct,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-product-category">Categoria</Label>
              <Select
                value={newProduct.categoryId}
                onValueChange={(value) =>
                  setNewProduct((currentProduct) => ({
                    ...currentProduct,
                    categoryId: value,
                  }))
                }
              >
                <SelectTrigger id="new-product-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {draft.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-product-price">Preço</Label>
              <Input
                id="new-product-price"
                inputMode="decimal"
                value={newProduct.price}
                onChange={(event) =>
                  setNewProduct((currentProduct) => ({
                    ...currentProduct,
                    price: event.target.value,
                  }))
                }
                placeholder="65,90"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-product-description">Descrição</Label>
              <Textarea
                id="new-product-description"
                value={newProduct.description}
                onChange={(event) =>
                  setNewProduct((currentProduct) => ({
                    ...currentProduct,
                    description: event.target.value,
                  }))
                }
                className="min-h-24"
              />
            </div>
            <Button type="button" onClick={addProduct}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
