import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "চেকআউট",
};

export default async function CheckoutPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">চেকআউট</h1>
      <p className="mt-2 text-muted-foreground">
        তথ্য পূরণ করে অর্ডার নিশ্চিত করুন — কোনো অগ্রিম পেমেন্ট প্রয়োজন নেই।
      </p>
      <CheckoutForm currency={settings.currency} />
    </div>
  );
}
