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
  // Cache on globalThis in EVERY environment. Production bundles can load
  // this module once per route chunk; without the cache each one opens its
  // own pool and Postgres eventually rejects with "too many clients" (53300).
  if (globalForDb.db) return globalForDb.db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Set it in the environment or .env.");
  }

  const client = postgres(connectionString, {
    max: 10,
    // Release idle connections so pools from multiple module instances
    // can't pile up against Postgres max_connections.
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  });
  const instance = drizzle(client, { schema });
  globalForDb.db = instance;
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
