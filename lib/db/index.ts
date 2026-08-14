import { sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL is not set. Database operations will fail until .env.local is configured."
  );
}

const sqlClient = connectionString ? neon(connectionString) : null;

export const db = sqlClient ? drizzle(sqlClient, { schema }) : null;

type Db = NonNullable<typeof db>;

/**
 * Run one Drizzle query as `logiparty_app` with `app.current_org_id` set.
 * Neon owner bypasses RLS; this role does not. Uses an HTTP transaction batch
 * so SET LOCAL + set_config apply to the query.
 */
export async function withOrgQuery<T>(
  orgId: string,
  build: (database: Db) => BatchItem<"pg">
): Promise<T> {
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }
  const [, , result] = await db.batch([
    db.execute(sql`SET LOCAL ROLE logiparty_app`),
    db.execute(sql`SELECT set_config('app.current_org_id', ${orgId}, true)`),
    build(db),
  ]);
  return result as T;
}

/** @deprecated Prefer withOrgQuery — bare set_config does not span neon-http calls */
export async function withOrgContext<T>(
  orgId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!sqlClient) {
    throw new Error("DATABASE_URL is not configured");
  }
  await sqlClient`SELECT set_config('app.current_org_id', ${orgId}, true)`;
  return fn();
}

export { schema };
