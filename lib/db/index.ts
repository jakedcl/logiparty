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

/** Session flags applied with the org id in one Neon HTTP batch. */
export type OrgActor = {
  isClient: boolean;
  clientCompanyId?: string | null;
  userId?: string | null;
};

type MembershipFlags = {
  id: string;
  isOrgAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isClient: boolean;
};

/**
 * Client-only sessions (no admin/manager/staff flag). Internal users return
 * undefined so queries stay org-scoped only.
 */
export function clientOnlyActor(
  user: MembershipFlags,
  clientCompanyId?: string | null
): OrgActor | undefined {
  const internal = user.isOrgAdmin || user.isManager || user.isStaff;
  if (!user.isClient || internal) return undefined;
  return {
    isClient: true,
    clientCompanyId: clientCompanyId ?? null,
    userId: user.id,
  };
}

function orgSessionConfig(orgId: string, actor?: OrgActor) {
  const isClient = actor?.isClient ? "true" : "false";
  const companyId =
    actor?.isClient && actor.clientCompanyId ? actor.clientCompanyId : "";
  const userId = actor?.userId ?? "";
  return sql`SELECT
    set_config('app.current_org_id', ${orgId}, true),
    set_config('app.is_client', ${isClient}, true),
    set_config('app.client_company_id', ${companyId}, true),
    set_config('app.current_user_id', ${userId}, true)`;
}

/**
 * Run one Drizzle query as `logiparty_app` with `app.current_org_id` set.
 * Neon owner bypasses RLS; this role does not. Uses an HTTP transaction batch
 * so SET LOCAL + set_config apply to the query.
 * Pass `actor` for a client-only session so company policies apply.
 */
export async function withOrgQuery<T>(
  orgId: string,
  build: (database: Db) => BatchItem<"pg">,
  actor?: OrgActor
): Promise<T> {
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }
  const [, , result] = await db.batch([
    db.execute(sql`SET LOCAL ROLE logiparty_app`),
    db.execute(orgSessionConfig(orgId, actor)),
    build(db),
  ]);
  return result as T;
}

/** Multiple queries in one org-scoped RLS transaction (e.g. mutate + activity log). */
export async function withOrgQueries(
  orgId: string,
  build: (database: Db) => [BatchItem<"pg">, ...BatchItem<"pg">[]],
  actor?: OrgActor
): Promise<unknown[]> {
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }
  const queries = build(db);
  const results = await db.batch([
    db.execute(sql`SET LOCAL ROLE logiparty_app`),
    db.execute(orgSessionConfig(orgId, actor)),
    ...queries,
  ]);
  return results.slice(2);
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
