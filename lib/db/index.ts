import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL is not set. Database operations will fail until .env.local is configured."
  );
}

const sql = connectionString ? neon(connectionString) : null;

export const db = sql ? drizzle(sql, { schema }) : null;

/**
 * Run a callback with org context set for RLS policies.
 * Requires SQL migration M0-4 (set_org_context function + policies).
 */
export async function withOrgContext<T>(
  orgId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured");
  }
  await sql`SELECT set_config('app.current_org_id', ${orgId}, true)`;
  return fn();
}

export { schema };
