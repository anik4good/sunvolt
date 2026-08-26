import { NextRequest, NextResponse } from "next/server";
import { toggleProductActive } from "../actions";
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
    
    await toggleProductActive(id, active);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle active error:", error);
    return NextResponse.json({ error: "Failed to toggle product status" }, { status: 500 });
  }
}