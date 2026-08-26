import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    const active = String(formData.get("active") ?? "true") === "true";

    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    await db.update(products).set({ active }).where(eq(products.id, id));
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle active error:", error);
    return NextResponse.json({ error: "Failed to toggle product status" }, { status: 500 });
  }
}
