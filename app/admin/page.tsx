import { AdminAuthGate } from "@/components/admin/admin-auth-gate";
import { MenuEditorDesktop } from "@/components/admin/menu-editor-desktop";
import { menuData } from "@/lib/menu-data";

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <MenuEditorDesktop initialMenuData={menuData} />
    </AdminAuthGate>
  );
}
