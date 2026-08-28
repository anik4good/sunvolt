import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";

const KEY_PREFIX = "sv_live_";

/** Generate a new API key. Plaintext is returned once, never stored. */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = KEY_PREFIX + randomBytes(24).toString("hex");
  return { key, prefix: key.slice(0, 14), hash: hashKey(key) };
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export interface AuthenticatedKey {
  id: string;
  name: string;
}

/**
 * Validate the API key on a request. Accepts `Authorization: Bearer <key>`
 * or `X-Api-Key: <key>`. Returns null when the key is missing, unknown,
 * or revoked.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<AuthenticatedKey | null> {
  const header = request.headers.get("authorization");
  let key: string | null = null;
  if (header?.toLowerCase().startsWith("bearer ")) {
    key = header.slice(7).trim();
  }
  if (!key) {
    key = request.headers.get("x-api-key")?.trim() ?? null;
  }
  if (!key) return null;

  const rows = await db
    .select({ id: apiKeys.id, name: apiKeys.name })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hashKey(key)), isNull(apiKeys.revokedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  // Best-effort usage stamp — never fail the request over this.
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => undefined);

  return row;
}
