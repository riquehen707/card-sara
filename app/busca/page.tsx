import { SearchProducts } from "@/components/menu/search-products";
import { products } from "@/lib/menu-data";

export default function SearchPage() {
  return <SearchProducts products={products} />;
}
