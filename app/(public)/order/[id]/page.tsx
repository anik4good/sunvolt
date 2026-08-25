import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getOrderWithDetails, getSettings } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, orderStatusColor } from "@/lib/order-status";
import { orderPlacedMessage, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "অর্ডার নিশ্চিত হয়েছে",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const [result, settings] = await Promise.all([
    getOrderWithDetails(id),
    getSettings(),
  ]);
  if (!result) notFound();

  const { order, product, items, appliances } = result;
  const orderNo = order.id.slice(0, 8).toUpperCase();
  // Prefer cart line items; fall back to the legacy single-package join.
  const lineItems =
    items.length > 0
      ? items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          total: Number(item.totalPrice),
        }))
      : product
        ? [
            {
              name: product.name,
              quantity: order.quantity,
              total: Number(product.price) * order.quantity,
            },
          ]
        : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-leaf/15 text-leaf">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-navy">
          অর্ডার গৃহীত হয়েছে!
        </h1>
        <p className="mt-2 text-muted-foreground">
          ধন্যবাদ {order.customerName}! আমাদের প্রতিনিধি শীঘ্রই{" "}
          {order.phone} নম্বরে কল করে অর্ডারটি নিশ্চিত করবেন।
        </p>
        <p className="mt-3 text-sm font-semibold text-navy">
          Order No: SV-{orderNo}
        </p>
        <span
          className={`mt-3 inline-block rounded-full px-4 py-1 text-xs font-bold ${orderStatusColor(order.status)}`}
        >
          স্ট্যাটাস: {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Order summary */}
      <div className="mt-8 space-y-4 rounded-2xl border bg-card p-6 text-sm">
        <h2 className="text-base font-bold text-navy">অর্ডারের বিবরণ</h2>
        {lineItems.map((item) => (
          <div key={item.name} className="flex justify-between border-b pb-3">
            <span className="text-muted-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="font-semibold text-navy">
              {formatPrice(item.total, settings.currency)}
            </span>
          </div>
        ))}
        {order.installationRequired ? (
          <div className="flex justify-between border-b pb-3">
            <span className="text-muted-foreground">ইনস্টলেশন</span>
            <span className="font-semibold text-navy">প্রয়োজন (চার্জ আলাদা)</span>
          </div>
        ) : null}
        {order.totalPrice !== null ? (
          <div className="flex justify-between border-b pb-3">
            <span className="text-muted-foreground">মোট মূল্য</span>
            <span className="text-lg font-extrabold text-navy">
              {formatPrice(order.totalPrice, settings.currency)}/-
            </span>
          </div>
        ) : null}

        {/* Calculator context saved for sales staff (plan §28) */}
        {appliances.length > 0 ? (
          <div className="rounded-xl bg-solar-light/50 p-4">
            <p className="font-bold text-navy">কাস্টমারের হিসাব</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {appliances.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.name} ({item.watt}W × {item.quantity} ={" "}
                  {item.totalWatt}W)
                </li>
              ))}
            </ul>
            <p className="mt-2 font-semibold text-navy">
              মোট লোড: {order.totalLoad}W
              {order.backupHours !== null ? ` · ব্যাকআপ: ${order.backupHours} ঘণ্টা` : ""}
              {order.requiredEnergy !== null ? ` · শক্তি: ${order.requiredEnergy}Wh` : ""}
            </p>
          </div>
        ) : null}

        <div>
          <p className="font-bold text-navy">ডেলিভারি ঠিকানা</p>
          <p className="mt-1 text-muted-foreground">
            {order.address}, {order.district}
          </p>
        </div>
        {order.notes ? (
          <div>
            <p className="font-bold text-navy">নোট</p>
            <p className="mt-1 text-muted-foreground">{order.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 text-center">
        <WhatsAppButton
          label="WhatsApp-এ অর্ডার কনফার্ম করুন"
          href={whatsappUrl(
            settings.whatsapp,
            orderPlacedMessage(
              order.id,
              lineItems.map((x) => `${x.name} × ${x.quantity}`).join(", "),
            ),
          )}
        />
        <div className="mt-4">
          <Button asChild variant="outline">
            <a href="/packages">আরও প্যাকেজ দেখুন</a>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          এই পেজটি বুকমার্ক করে রাখুন — Order No SV-{orderNo} দিয়ে যেকোনো
          সময় অর্ডারের স্ট্যাটাস জানতে পারবেন।
        </p>
      </div>
    </div>
  );
}
