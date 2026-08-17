/**
 * Cross-org RLS + RBAC smoke tests.
 * Run: npm run test:integration (requires DATABASE_URL, acme + demo orgs seeded)
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";
import {
  canAccessClientPortal,
  canAccessInternalDashboard,
  canManageJobs,
  canSubmitAvailability,
  canUploadDocuments,
  canViewMyJobs,
} from "../lib/auth/permissions";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function verifyCatalogRls(
  sql: ReturnType<typeof neon>,
  orgA: { id: string; slug: string },
  orgB: { id: string; slug: string }
) {
  const marker = `integration-catalog-${Date.now()}`;
  await sql`
    INSERT INTO inventory_items (org_id, sku, name, total_quantity)
    VALUES (${orgA.id}, ${marker}, 'Integration check', 1)
  `;
  try {
    const underB = await sql.transaction([
      sql`SET LOCAL ROLE logiparty_app`,
      sql`SELECT set_config('app.current_org_id', ${orgB.id}, true)`,
      sql`SELECT sku FROM inventory_items WHERE sku = ${marker}`,
    ]);
    const seenB = (underB[2] as { sku: string }[]).length;
    assert(seenB === 0, `Catalog RLS: ${orgB.slug} saw acme inventory`);
    console.log("OK: catalog cross-org isolation");
  } finally {
    await sql`DELETE FROM inventory_items WHERE sku = ${marker}`;
  }
}

async function verifyJobsRls(
  sql: ReturnType<typeof neon>,
  orgA: { id: string; slug: string },
  orgB: { id: string; slug: string }
) {
  const companies = await sql`
    SELECT id FROM client_companies WHERE org_id = ${orgA.id} LIMIT 1
  `;
  if (companies.length === 0) {
    console.log("SKIP: jobs RLS (no client company on acme — run db:seed:demo)");
    return;
  }

  const marker = `integration-job-${Date.now()}`;
  const inserted = await sql`
    INSERT INTO jobs (org_id, client_company_id, name, status)
    VALUES (${orgA.id}, ${companies[0].id}, ${marker}, 'draft')
    RETURNING id
  `;
  const jobId = inserted[0].id as string;

  try {
    const underB = await sql.transaction([
      sql`SET LOCAL ROLE logiparty_app`,
      sql`SELECT set_config('app.current_org_id', ${orgB.id}, true)`,
      sql`SELECT name FROM jobs WHERE id = ${jobId}`,
    ]);
    const seenB = (underB[2] as { name: string }[]).length;
    assert(seenB === 0, `Jobs RLS: ${orgB.slug} saw acme job`);
    console.log("OK: jobs cross-org isolation");
  } finally {
    await sql`DELETE FROM jobs WHERE id = ${jobId}`;
  }
}

function verifyRbacMatrix() {
  const manager = {
    isOrgAdmin: false,
    isManager: true,
    isStaff: false,
    isClient: false,
  };
  const staff = {
    isOrgAdmin: false,
    isManager: false,
    isStaff: true,
    isClient: false,
  };
  const client = {
    isOrgAdmin: false,
    isManager: false,
    isStaff: false,
    isClient: true,
  };

  assert(canManageJobs(manager), "Manager should manage jobs");
  assert(!canManageJobs(staff), "Staff should not manage jobs");
  assert(canViewMyJobs(staff), "Staff should view my jobs");
  assert(!canViewMyJobs(manager), "Manager-only should not use my jobs");
  assert(canAccessInternalDashboard(staff), "Staff internal dashboard");
  assert(!canAccessInternalDashboard(client), "Client not internal");
  assert(canAccessClientPortal(client), "Client portal");
  assert(!canAccessClientPortal(staff), "Staff not client portal");
  assert(canUploadDocuments(client), "Client uploads docs");
  assert(!canUploadDocuments(staff), "Staff no doc upload");
  assert(canSubmitAvailability(staff), "Staff submits availability");
  assert(!canSubmitAvailability(manager), "Manager-only no availability submit");

  console.log("OK: RBAC permission matrix");
}

async function main() {
  loadEnvLocal();
  verifyRbacMatrix();

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("SKIP: database RLS checks (DATABASE_URL not set)");
    return;
  }

  const sql = neon(url);
  const orgs = await sql`SELECT id, slug FROM organizations ORDER BY slug LIMIT 2`;
  if (orgs.length < 2) {
    throw new Error("Need acme + demo orgs — run npm run db:seed");
  }

  await verifyCatalogRls(sql, orgs[0], orgs[1]);
  await verifyJobsRls(sql, orgs[0], orgs[1]);
  console.log("All integration checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
