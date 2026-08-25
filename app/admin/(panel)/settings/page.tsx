import { getSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings | SunVolt Admin" };

interface PageProps {
  searchParams: Promise<{ saved?: string }>;
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const { saved } = await searchParams;
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Business contact info and calculator parameters — used across the whole website.
      </p>
      {saved ? (
        <p className="mt-4 rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">
          Settings saved.
        </p>
      ) : null}
      <SettingsForm settings={settings} />
    </div>
  );
}
