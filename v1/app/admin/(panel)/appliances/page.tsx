import Link from "next/link";
import { asc } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { appliances } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ActiveStatusBadge } from "@/components/admin/status-badge";
import { toggleApplianceActive, deleteAppliance } from "./actions";

export const metadata = { title: "Appliances | SunVolt Admin" };

interface PageProps {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}

export default async function AdminAppliancesPage({ searchParams }: PageProps) {
  const { saved, deleted } = await searchParams;
  const rows = await db.select().from(appliances).orderBy(asc(appliances.name));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Appliances"
        description="These power the calculator — wattage changes apply instantly."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/appliances/new">
              <Plus aria-hidden />
              New Appliance
            </Link>
          </Button>
        }
      />

      {saved ? (
        <p className="rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Appliance saved.</p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Appliance deleted.</p>
      ) : null}

      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Appliance</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Default watt</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((appliance) => (
              <tr key={appliance.id} className="border-t hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <span className="mr-2 text-lg" aria-hidden>{appliance.icon}</span>
                  <span className="font-semibold">{appliance.name}</span>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{appliance.category}</td>
                <td className="px-4 py-3 font-medium">{appliance.defaultWatt}W</td>
                <td className="px-4 py-3">
                  <ActiveStatusBadge active={appliance.active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <form action={toggleApplianceActive.bind(null, appliance.id, !appliance.active)}>
                      <Button type="submit" variant="outline" size="sm">
                        {appliance.active ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/appliances/${appliance.id}`}>
                        <Pencil aria-hidden />
                        Edit
                      </Link>
                    </Button>
                    <DeleteButton
                      label=""
                      confirmText={`Delete "${appliance.name}"?`}
                      action={deleteAppliance}
                      id={appliance.id}
                      className="h-8 px-2.5 text-destructive"
                      icon={<Trash2 className="size-4" aria-hidden />}
                    />
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
