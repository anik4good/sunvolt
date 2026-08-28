"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-auth";

/**
 * Create an API key. The plaintext key is returned exactly once —
 * only its SHA-256 hash is persisted.
 */
export async function createApiKey(
  name: string,
): Promise<{ key?: string; error?: string }> {
  await requireAdmin();

  const parsed = z.string().trim().min(1, "Name is required").max(60).safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the name." };
  }

  const { key, prefix, hash } = generateApiKey();
  await db.insert(apiKeys).values({ name: parsed.data, prefix, keyHash: hash });
  revalidatePath("/admin/developers");
  return { key };
}

/** Revoke a key — it stops authenticating immediately. */
export async function revokeApiKey(id: string): Promise<void> {
  await requireAdmin();
  await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id));
  revalidatePath("/admin/developers");
}
