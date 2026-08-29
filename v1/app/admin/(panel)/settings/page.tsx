import { getSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/admin/settings-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const metadata = { title: "Settings | SunVolt Admin" };

interface PageProps {
  searchParams: Promise<{ saved?: string }>;
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const { saved } = await searchParams;
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Business contact info and calculator parameters — used across the whole website."
      />
      {saved ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          Settings saved.
        </p>
      ) : null}
      <SettingsForm settings={settings} />
    </div>
  );
}
