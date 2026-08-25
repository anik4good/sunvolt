import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appliances } from "@/db/schema";
import { ApplianceForm } from "@/components/admin/appliance-form";

export const metadata = { title: "Edit Appliance | SunVolt Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAppliancePage({ params }: PageProps) {
  const { id } = await params;
  const rows = await db.select().from(appliances).where(eq(appliances.id, id)).limit(1);
  const appliance = rows[0];
  if (!appliance) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Edit: {appliance.name}</h1>
      <ApplianceForm appliance={appliance} />
    </div>
  );
}
