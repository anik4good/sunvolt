import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/**
 * Inline table toggles from the products workspace.
 * POST form fields: id, field ("active" | "featured"), value ("true" | "false")
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    const field = String(formData.get("field") ?? "active");
    const value = String(formData.get("value") ?? "true") === "true";

    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }
    if (field !== "active" && field !== "featured") {
      return NextResponse.json({ error: "Invalid toggle field" }, { status: 400 });
    }

    await db
      .update(products)
      .set(field === "active" ? { active: value } : { featured: value })
      .where(eq(products.id, id));
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle product error:", error);
    return NextResponse.json({ error: "Failed to toggle product status" }, { status: 500 });
  }
}
