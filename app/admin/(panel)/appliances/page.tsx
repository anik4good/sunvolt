import Link from "next/link";
import { asc } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { appliances } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Appliances</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            These power the calculator — wattage changes apply instantly.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/appliances/new">
            <Plus aria-hidden />
            New Appliance
          </Link>
        </Button>
      </div>

      {saved ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Appliance saved.</p>
      ) : null}
      {deleted ? (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-medium text-leaf">Appliance deleted.</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card">
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
                  <span className="font-semibold text-navy">{appliance.name}</span>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{appliance.category}</td>
                <td className="px-4 py-3 font-medium">{appliance.defaultWatt}W</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      appliance.active
                        ? "border-leaf text-leaf"
                        : "border-muted-foreground text-muted-foreground"
                    }
                  >
                    {appliance.active ? "active" : "disabled"}
                  </Badge>
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
    </div>
  );
}
