import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminPanelLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await requireAdmin();

  return (
    <AdminShell email={session.sub}>
      {children}
    </AdminShell>
  );
}
