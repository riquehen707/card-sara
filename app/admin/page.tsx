import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { MenuEditor } from "@/components/admin/menu-editor";
import { menuData } from "@/lib/menu-data";

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <MenuEditor initialMenuData={menuData} />
    </AdminAuthGate>
  );
}
