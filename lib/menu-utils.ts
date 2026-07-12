import { categories, products } from "@/lib/menu-data";
import type { Product } from "@/types/menu";

export function formatCurrency(value: number | null) {
  if (value === null) {
    return "Sob consulta";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getCategoryName(categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "";
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(categoryId: string) {
  if (categoryId === "todos") {
    return products;
  }

  if (categoryId === "promocoes") {
    return products.filter((product) => product.isPromotional);
  }

  if (categoryId === "novidades") {
    return products.filter((product) => product.isNew);
  }

  return products.filter((product) => product.categoryId === categoryId);
}

export function getRelatedProducts(product: Product, limit = 3) {
  return products
    .filter(
      (relatedProduct) =>
        relatedProduct.categoryId === product.categoryId &&
        relatedProduct.id !== product.id
    )
    .slice(0, limit);
}

export function searchProducts(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return products.filter((product) => {
    const searchableText = [
      product.name,
      product.shortDescription,
      product.description,
      getCategoryName(product.categoryId),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}
