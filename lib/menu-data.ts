import menuJson from "@/data/menu.json";
import { menuDataSchema } from "@/types/menu";

export const menuData = menuDataSchema.parse(menuJson);

function sortByOrder<T extends { name: string; order?: number }>(items: T[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((firstItem, secondItem) => {
      const orderDifference =
        (firstItem.item.order ?? firstItem.index) -
        (secondItem.item.order ?? secondItem.index);

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return firstItem.item.name.localeCompare(secondItem.item.name, "pt-BR");
    })
    .map(({ item }) => item);
}

function sortProducts() {
  const categoryOrderById = new Map(
    categories.map((category, index) => [category.id, category.order ?? index])
  );

  return menuData.products
    .map((product, index) => ({ product, index }))
    .sort((firstItem, secondItem) => {
      const categoryOrderDifference =
        (categoryOrderById.get(firstItem.product.categoryId) ??
          Number.MAX_SAFE_INTEGER) -
        (categoryOrderById.get(secondItem.product.categoryId) ??
          Number.MAX_SAFE_INTEGER);

      if (categoryOrderDifference !== 0) {
        return categoryOrderDifference;
      }

    const orderDifference =
      (firstItem.product.order ?? firstItem.index) -
      (secondItem.product.order ?? secondItem.index);

    if (orderDifference !== 0) {
      return orderDifference;
    }

      return firstItem.product.name.localeCompare(
        secondItem.product.name,
        "pt-BR"
      );
    })
    .map(({ product }) => product);
}

export const establishment = menuData.establishment;
export const categories = sortByOrder(menuData.categories);
export const products = sortProducts();
