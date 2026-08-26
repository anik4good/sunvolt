import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appliances, orderAppliances } from "@/db/schema";
import {
  json,
  conflict,
  notFound,
  parseBody,
  revalidateSite,
  withApiKey,
} from "@/lib/api";
import { applianceUpdateSchema } from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function findAppliance(id: string) {
  const rows = await db.select().from(appliances).where(eq(appliances.id, id)).limit(1);
  return rows[0] ?? null;
}

/** GET /api/v1/appliances/{id} */
export const GET = withApiKey<Ctx>(async (_request, ctx) => {
  const { id } = await ctx.params;
  const appliance = await findAppliance(id);
  if (!appliance) return notFound("Appliance");
  return json(appliance);
});

/** PATCH /api/v1/appliances/{id} */
export const PATCH = withApiKey<Ctx>(async (request, ctx) => {
  const { id } = await ctx.params;
  const existing = await findAppliance(id);
  if (!existing) return notFound("Appliance");

  const parsed = await parseBody(request, applianceUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const [updated] = await db
    .update(appliances)
    .set(parsed.data)
    .where(eq(appliances.id, id))
    .returning();
  revalidateSite();
  return json(updated);
});

/** DELETE /api/v1/appliances/{id} — 409 when saved orders use it. */
export const DELETE = withApiKey<Ctx>(async (_request, ctx) => {
  const { id } = await ctx.params;
  const existing = await findAppliance(id);
  if (!existing) return notFound("Appliance");

  const referenced = await db
    .select({ id: orderAppliances.id })
    .from(orderAppliances)
    .where(eq(orderAppliances.applianceId, id))
    .limit(1);
  if (referenced.length > 0) {
    return conflict(
      "This appliance appears in saved orders and can't be deleted. Set active=false instead.",
    );
  }

  await db.delete(appliances).where(eq(appliances.id, id));
  revalidateSite();
  return json({ deleted: true });
});
