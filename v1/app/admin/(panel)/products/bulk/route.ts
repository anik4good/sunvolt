import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/**
 * Bulk operations from the products workspace: publish / unpublish / delete.
 * Deletion is guarded — products attached to order items are skipped and
 * reported back so the UI can show what failed.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = (await request.json()) as {
      action?: string;
      ids?: unknown;
    };
    const action = body.action ?? "";
    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];

    if (!["publish", "unpublish", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid bulk action" }, { status: 400 });
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    if (action === "publish" || action === "unpublish") {
      await db
        .update(products)
        .set({ active: action === "publish" })
        .where(inArray(products.id, ids));
      revalidatePath("/", "layout");
      return NextResponse.json({ updated: ids.length });
    }

    // action === "delete": try each id separately — referenced products fail.
    let deleted = 0;
    const failed: { id: string; reason: string }[] = [];
    for (const id of ids) {
      try {
        await db.delete(products).where(inArray(products.id, [id]));
        deleted += 1;
      } catch {
        failed.push({ id, reason: "attached to orders" });
      }
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ deleted, failed });
  } catch (error) {
    console.error("Bulk products error:", error);
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 });
  }
}
