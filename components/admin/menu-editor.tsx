"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  PlusIcon,
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
import type { Category, MenuData, Product } from "@/types/menu";
import { menuDataSchema } from "@/types/menu";

type MenuEditorProps = {
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

const draftStorageKey = "cardapio-sara-admin-draft-v1";

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

function getImageForCategory(categoryId: string) {
  void categoryId;

  return "/mock/placeholder.svg";
}

function createInitialDraft(menuData: MenuData): DraftMenuData {
  return {
    ...menuData,
    products: menuData.products.map((product) => ({ ...product })),
  };
}

function productFingerprint(product: ProductDraft) {
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

function getCategoryName(categories: Category[], categoryId: string) {
  return (
    categories.find((category) => category.id === categoryId)?.name ??
    "Sem categoria"
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

export function MenuEditor({ initialMenuData }: MenuEditorProps) {
  const initialFingerprint = getDraftFingerprint(initialMenuData);
  const [draft, setDraft] = useState<DraftMenuData>(() =>
    getStoredDraft(initialMenuData, initialFingerprint)
  );
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("todos");
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(() =>
    createPriceInputs(getStoredDraft(initialMenuData, initialFingerprint).products)
  );
  const [priceErrors, setPriceErrors] = useState<PriceErrors>({});
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    description: "",
    categoryId: initialMenuData.categories[0]?.id ?? "",
    price: "",
  });
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

  const visibleProducts = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return draft.products.filter((product) => {
      if (categoryId !== "todos" && product.categoryId !== categoryId) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = normalizeText(
        `${product.name} ${product.description} ${product.shortDescription}`
      );

      return searchableText.includes(normalizedQuery);
    });
  }, [categoryId, draft.products, query]);

  const changeCount = countChanges(draft.products, initialMenuData.products);
  const hasPriceErrors = Object.values(priceErrors).some(Boolean);

  function updateProduct(productId: string, updater: (product: ProductDraft) => ProductDraft) {
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

  function discardChanges() {
    setDraft(createInitialDraft(initialMenuData));
    setPriceInputs(
      Object.fromEntries(
        initialMenuData.products.map((product) => [
          product.id,
          formatPriceInput(product.price),
        ])
      )
    );
    setPriceErrors({});
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

    const slugBase = createSlug(newProduct.name) || "produto";
    const existingSlugs = new Set(draft.products.map((product) => product.slug));
    let slug = slugBase;
    let suffix = 2;

    while (existingSlugs.has(slug)) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;
    }

    const id = slug;
    const description = newProduct.description.trim();
    const product: ProductDraft = {
      id,
      slug,
      name: newProduct.name.trim(),
      categoryId: newProduct.categoryId,
      shortDescription: description,
      description,
      price: parsedPrice.value,
      portion: "Serve 1 pessoa",
      imageUrl: getImageForCategory(newProduct.categoryId),
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
    setNewProduct({
      name: "",
      description: "",
      categoryId: initialMenuData.categories[0]?.id ?? "",
      price: "",
    });
    setNewProductOpen(false);
    setPublishMessage(null);
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

    try {
      const response = await fetch("/api/admin/menu/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95">
        <div className="mx-auto grid h-14 w-full max-w-5xl grid-cols-[44px_1fr_44px] items-center gap-2 px-4">
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
          <div className="text-center">
            <h1 className="text-sm font-semibold">Administração</h1>
            <p className="text-xs text-muted-foreground">Cardápio Sara</p>
          </div>
          <span aria-hidden="true" />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5">
        <section className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Produtos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edite vários itens e publique tudo em um único commit.
              </p>
            </div>
            <Button onClick={() => setNewProductOpen(true)}>
              <PlusIcon className="size-4" aria-hidden="true" />
              Adicionar produto
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por produto ou descrição"
                className="pl-9"
                aria-label="Buscar produto"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger aria-label="Filtrar por categoria">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {draft.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="grid gap-3" aria-label="Lista administrativa">
          {visibleProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-secondary/60 p-8 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          ) : (
            visibleProducts.map((product) => {
              const originalProduct = originalProductsById.get(product.id);
              const changeState = getProductChangeState(
                product,
                originalProduct
              );
              const priceError = priceErrors[product.id];

              return (
                <article
                  key={product.id}
                  className={cn(
                    "grid gap-3 rounded-xl border bg-card p-3 shadow-xs",
                    changeState === "changed" &&
                      "border-primary/40 bg-secondary/40",
                    changeState === "added" && "border-primary/50",
                    changeState === "removed" && "opacity-60"
                  )}
                >
                  <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(220px,1fr)_150px_140px_120px] md:items-start">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={product.name}
                          onChange={(event) =>
                            updateProduct(product.id, (currentProduct) => ({
                              ...currentProduct,
                              name: event.target.value,
                              imageAlt: event.target.value,
                            }))
                          }
                          aria-label={`Nome de ${product.name}`}
                          className="font-medium"
                          disabled={product.removed}
                        />
                        {changeState !== "unchanged" && (
                          <Badge variant="outline">
                            {changeState === "removed"
                              ? "Removido"
                              : "Alterado"}
                          </Badge>
                        )}
                      </div>
                      <Textarea
                        value={product.description}
                        onChange={(event) =>
                          updateProduct(product.id, (currentProduct) => ({
                            ...currentProduct,
                            description: event.target.value,
                            shortDescription: event.target.value,
                          }))
                        }
                        aria-label={`Descrição de ${product.name}`}
                        className="min-h-20 resize-y"
                        disabled={product.removed}
                      />
                      <p className="text-xs text-muted-foreground">
                        {getCategoryName(draft.categories, product.categoryId)}
                      </p>
                    </div>

                    <div className="grid gap-1">
                      <Label htmlFor={`price-${product.id}`}>Preço</Label>
                      <Input
                        id={`price-${product.id}`}
                        inputMode="decimal"
                        value={priceInputs[product.id] ?? ""}
                        onChange={(event) =>
                          updatePrice(product.id, event.target.value)
                        }
                        aria-invalid={Boolean(priceError)}
                        disabled={product.removed}
                      />
                      <p
                        className={cn(
                          "text-xs",
                          priceError
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {priceError ?? formatCurrency(product.price)}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label>Disponível</Label>
                      <div className="flex min-h-11 items-center gap-3 rounded-lg border px-3">
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
                        <span className="text-sm text-muted-foreground">
                          {product.available ? "Sim" : "Não"}
                        </span>
                      </div>
                    </div>

                    <div className="flex md:justify-end">
                      <Button
                        type="button"
                        variant={product.removed ? "secondary" : "outline"}
                        onClick={() =>
                          updateProduct(product.id, (currentProduct) => ({
                            ...currentProduct,
                            removed: !currentProduct.removed,
                          }))
                        }
                      >
                        <Trash2Icon className="size-4" aria-hidden="true" />
                        {product.removed ? "Restaurar" : "Remover"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">
                {changeCount} alteração{changeCount === 1 ? "" : "es"} não
                publicada{changeCount === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-muted-foreground">
                O histórico fica no GitHub a cada publicação.
              </p>
              {publishMessage && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {publishMessage}
                </p>
              )}
            </div>
            <div className="grid gap-2 md:flex md:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={discardChanges}
                disabled={changeCount === 0 || publishing}
              >
                Descartar alterações
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    disabled={
                      changeCount === 0 || hasPriceErrors || publishing
                    }
                  >
                    <SaveIcon className="size-4" aria-hidden="true" />
                    Publicar alterações
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Publicar alterações no cardápio?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação criará um único commit no GitHub com{" "}
                      {changeCount} alteração{changeCount === 1 ? "" : "es"}.
                      A Vercel deverá iniciar um novo deploy após o commit.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={publishChanges}>
                      Confirmar publicação
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>
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
    </>
  );
}
