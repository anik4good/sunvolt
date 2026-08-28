import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Liveness + database reachability probe for Docker healthchecks. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", database: "up" });
  } catch {
    // Service is up even if the DB is briefly unreachable.
    return NextResponse.json({ status: "ok", database: "down" }, { status: 200 });
  }
}
