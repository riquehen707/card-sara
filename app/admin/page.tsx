import { MenuEditor } from "@/components/admin/menu-editor";
import { menuData } from "@/lib/menu-data";

export default function AdminPage() {
  return <MenuEditor initialMenuData={menuData} />;
}
