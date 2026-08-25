import { drizzle } from "drizzle-orm/postgres-js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import postgres from "postgres";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

/**
 * The database client is created lazily on the first query so that
 * `next build` (e.g. inside Docker, with no DATABASE_URL) can import
 * this module while collecting page data without connecting.
 */
function getDb(): Db {
  const globalForDb = globalThis as unknown as { db?: Db };
  if (globalForDb.db) return globalForDb.db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Set it in the environment or .env.");
  }

  // Reuse the connection across Next.js dev-server hot reloads.
  const client = postgres(connectionString, { max: 10 });
  const instance = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.db = instance;
  }
  return instance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, _receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

export { schema };
