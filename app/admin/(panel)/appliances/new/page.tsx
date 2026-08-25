import { ApplianceForm } from "@/components/admin/appliance-form";

export const metadata = { title: "New Appliance | SunVolt Admin" };

export default function NewAppliancePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New Appliance</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a device customers can select in the calculator.
      </p>
      <ApplianceForm />
    </div>
  );
}
