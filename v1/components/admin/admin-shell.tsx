"use client";

import { AdminThemeProvider } from "@/components/admin/admin-theme";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/sidebar";

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <div className="flex min-h-screen bg-secondary/40 dark:bg-background">
        <AdminSidebar email={email} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader email={email} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
