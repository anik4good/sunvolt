import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminPanelLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-secondary/40 lg:flex">
      <AdminSidebar email={session.sub} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
