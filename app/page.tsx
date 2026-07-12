import { PublicMenu } from "@/components/menu/public-menu";
import { categories, establishment, products } from "@/lib/menu-data";

export default function Home() {
  return (
    <PublicMenu
      establishment={establishment}
      categories={categories}
      products={products}
    />
  );
}
