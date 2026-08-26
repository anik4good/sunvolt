import { type NextRequest } from "next/server";
import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { appliances } from "@/db/schema";
import {
  json,
  listResponse,
  parseBody,
  parsePagination,
  revalidateSite,
  withApiKey,
} from "@/lib/api";
import { applianceCreateSchema } from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

/** GET /api/v1/appliances — list calculator load presets. */
export const GET = withApiKey(async (request: NextRequest) => {
  const { limit, offset } = parsePagination(request.nextUrl);
  const params = request.nextUrl.searchParams;

  const conditions: SQL[] = [];
  const active = params.get("active");
  if (active === "true" || active === "false") {
    conditions.push(eq(appliances.active, active === "true"));
  }
  const q = params.get("q")?.trim().toLowerCase();
  if (q) {
    conditions.push(sql`lower(${appliances.name}) like ${`%${q}%`}`);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, counted] = await Promise.all([
    db.select().from(appliances).where(where).orderBy(asc(appliances.name)).limit(limit).offset(offset),
    db.select({ value: sql<number>`count(*)::int` }).from(appliances).where(where),
  ]);

  return listResponse(rows, counted[0]?.value ?? 0, limit, offset);
});

/** POST /api/v1/appliances — create a preset. */
export const POST = withApiKey(async (request: NextRequest) => {
  const parsed = await parseBody(request, applianceCreateSchema);
  if (!parsed.ok) return parsed.response;

  const [created] = await db.insert(appliances).values(parsed.data).returning();
  revalidateSite();
  return json(created, 201);
});
