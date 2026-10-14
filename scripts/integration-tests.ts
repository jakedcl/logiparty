/**
 * Cross-org RLS + RBAC smoke tests.
 * Run: npm run test:integration (requires DATABASE_URL; creates ephemeral 2nd org)
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
  // neon() generic vs transaction helper — keep this script simple
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sql: any,
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
    assert(seenB === 0, `Catalog RLS: ${orgB.slug} saw test inventory`);
    console.log("OK: catalog cross-org isolation");
  } finally {
    await sql`DELETE FROM inventory_items WHERE sku = ${marker}`;
  }
}

async function verifyJobsRls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sql: any,
  orgA: { id: string; slug: string },
  orgB: { id: string; slug: string }
) {
  const companies = await sql`
    SELECT id FROM client_companies WHERE org_id = ${orgA.id} LIMIT 1
  `;
  if (companies.length === 0) {
    console.log("SKIP: jobs RLS (no client company on test — run db:seed)");
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
    assert(seenB === 0, `Jobs RLS: ${orgB.slug} saw test job`);
    console.log("OK: jobs cross-org isolation");
  } finally {
    await sql`DELETE FROM jobs WHERE id = ${jobId}`;
  }
}

type Neon = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (strings: TemplateStringsArray, ...values: any[]): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: (queries: any[]) => Promise<any[]>;
};

function sessionConfig(
  sql: Neon,
  orgId: string,
  isClient: boolean,
  clientCompanyId: string
) {
  return sql`SELECT
    set_config('app.current_org_id', ${orgId}, true),
    set_config('app.is_client', ${isClient ? "true" : "false"}, true),
    set_config('app.client_company_id', ${isClient ? clientCompanyId : ""}, true),
    set_config('app.current_user_id', ${""}, true)`;
}

async function countVisible(
  sql: Neon,
  orgId: string,
  isClient: boolean,
  clientCompanyId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any
) {
  const rows = await sql.transaction([
    sql`SET LOCAL ROLE logiparty_app`,
    sessionConfig(sql, orgId, isClient, clientCompanyId),
    query,
  ]);
  return (rows[2] as unknown[]).length;
}

/** Client A vs B in one org, plus a second tenant. Internal role is is_client=false. */
async function verifyClientIsolation(sql: Neon) {
  const stamp = Date.now();
  const [user] = (await sql`
    INSERT INTO users (email)
    VALUES (${`client-rls-${stamp}@example.com`})
    RETURNING id
  `) as { id: string }[];
  const [orgA] = (await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name)
    VALUES (${`client-rls-a-${stamp}`}, 'Client RLS A', '#000000', 'A')
    RETURNING id
  `) as { id: string }[];
  const [orgB] = (await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name)
    VALUES (${`client-rls-b-${stamp}`}, 'Client RLS B', '#000000', 'B')
    RETURNING id
  `) as { id: string }[];

  try {
    const [companyA] = (await sql`
      INSERT INTO client_companies (org_id, name)
      VALUES (${orgA.id}, 'Company A')
      RETURNING id
    `) as { id: string }[];
    const [companyB] = (await sql`
      INSERT INTO client_companies (org_id, name)
      VALUES (${orgA.id}, 'Company B')
      RETURNING id
    `) as { id: string }[];
    const [companyOther] = (await sql`
      INSERT INTO client_companies (org_id, name)
      VALUES (${orgB.id}, 'Other tenant')
      RETURNING id
    `) as { id: string }[];

    const [jobA] = (await sql`
      INSERT INTO jobs (org_id, client_company_id, name, status)
      VALUES (${orgA.id}, ${companyA.id}, ${`job-a-${stamp}`}, 'upcoming')
      RETURNING id
    `) as { id: string }[];
    const [jobB] = (await sql`
      INSERT INTO jobs (org_id, client_company_id, name, status)
      VALUES (${orgA.id}, ${companyB.id}, ${`job-b-${stamp}`}, 'upcoming')
      RETURNING id
    `) as { id: string }[];
    const [jobOther] = (await sql`
      INSERT INTO jobs (org_id, client_company_id, name, status)
      VALUES (${orgB.id}, ${companyOther.id}, ${`job-other-${stamp}`}, 'upcoming')
      RETURNING id
    `) as { id: string }[];

    await sql`
      INSERT INTO job_locations (job_id, org_id, label, address, sort_order)
      VALUES
        (${jobA.id}, ${orgA.id}, 'A', '1 A St', 0),
        (${jobB.id}, ${orgA.id}, 'B', '2 B St', 0)
    `;
    const [itemA] = (await sql`
      INSERT INTO client_inventory_items (org_id, client_company_id, sku, name)
      VALUES (${orgA.id}, ${companyA.id}, ${`sku-a-${stamp}`}, 'Item A')
      RETURNING id
    `) as { id: string }[];
    const [itemB] = (await sql`
      INSERT INTO client_inventory_items (org_id, client_company_id, sku, name)
      VALUES (${orgA.id}, ${companyB.id}, ${`sku-b-${stamp}`}, 'Item B')
      RETURNING id
    `) as { id: string }[];
    await sql`
      INSERT INTO job_inventory_lines (job_id, org_id, item_type, client_item_id, quantity_assigned)
      VALUES
        (${jobA.id}, ${orgA.id}, 'client', ${itemA.id}, 1),
        (${jobB.id}, ${orgA.id}, 'client', ${itemB.id}, 1)
    `;
    const [vehicle] = (await sql`
      INSERT INTO fleet_vehicles (org_id, name)
      VALUES (${orgA.id}, ${`van-${stamp}`})
      RETURNING id
    `) as { id: string }[];
    await sql`
      INSERT INTO job_fleet_assignments (job_id, fleet_vehicle_id, org_id)
      VALUES (${jobA.id}, ${vehicle.id}, ${orgA.id}), (${jobB.id}, ${vehicle.id}, ${orgA.id})
    `;
    await sql`
      INSERT INTO job_assignments (job_id, org_id, user_id, phase, assigned_role)
      VALUES
        (${jobA.id}, ${orgA.id}, ${user.id}, 'LoadIn', 'Laborer'),
        (${jobB.id}, ${orgA.id}, ${user.id}, 'LoadIn', 'Laborer')
    `;
    await sql`
      INSERT INTO documents (
        org_id, job_id, uploaded_by, uploader_role, file_name, storage_key, file_size_bytes, mime_type
      ) VALUES
        (${orgA.id}, ${jobA.id}, ${user.id}, 'client', 'a.pdf', ${`key-a-${stamp}`}, 1, 'application/pdf'),
        (${orgA.id}, ${jobB.id}, ${user.id}, 'client', 'b.pdf', ${`key-b-${stamp}`}, 1, 'application/pdf')
    `;
    await sql`
      INSERT INTO availability_requests (org_id, user_id, start_time, end_time, reason)
      VALUES (${orgA.id}, ${user.id}, NOW(), NOW() + INTERVAL '1 hour', 'off')
    `;
    await sql`
      INSERT INTO client_notes (org_id, client_company_id, sent_by_user_id, body)
      VALUES
        (${orgA.id}, ${companyA.id}, ${user.id}, 'note a'),
        (${orgA.id}, ${companyB.id}, ${user.id}, 'note b')
    `;
    await sql`
      INSERT INTO client_inventory_requests (
        org_id, client_company_id, requested_by_user_id, type, reason
      ) VALUES
        (${orgA.id}, ${companyA.id}, ${user.id}, 'add', 'req a'),
        (${orgA.id}, ${companyB.id}, ${user.id}, 'add', 'req b')
    `;

    const asClientA = (query: ReturnType<Neon>) =>
      countVisible(sql, orgA.id, true, companyA.id, query);
    const asInternal = (query: ReturnType<Neon>) =>
      countVisible(sql, orgA.id, false, companyA.id, query);

    assert(
      (await asClientA(sql`SELECT id FROM client_companies`)) === 1,
      "Client A saw another company"
    );
    assert(
      (await asClientA(sql`SELECT id FROM jobs`)) === 1,
      "Client A saw another company's job"
    );
    assert(
      (await asClientA(sql`SELECT job_id FROM job_locations`)) === 1,
      "Client A saw another job location"
    );
    assert(
      (await asClientA(sql`SELECT id FROM job_inventory_lines`)) === 1,
      "Client A saw another job inventory line"
    );
    assert(
      (await asClientA(sql`SELECT job_id FROM job_fleet_assignments`)) === 1,
      "Client A saw another fleet assignment"
    );
    assert(
      (await asClientA(sql`SELECT id FROM job_assignments`)) === 1,
      "Client A saw another crew assignment"
    );
    assert(
      (await asClientA(sql`SELECT id FROM documents`)) === 1,
      "Client A saw another company's document"
    );
    assert(
      (await asClientA(sql`SELECT id FROM client_inventory_items`)) === 1,
      "Client A saw another company's inventory"
    );
    assert(
      (await asClientA(sql`SELECT id FROM client_inventory_requests`)) === 1,
      "Client A saw another company's inventory request"
    );
    assert(
      (await asClientA(sql`SELECT id FROM client_notes`)) === 0,
      "Client saw client_notes"
    );
    assert(
      (await asClientA(sql`SELECT id FROM availability_requests`)) === 0,
      "Client saw availability_requests"
    );

    const otherTenantJobs = await countVisible(
      sql,
      orgB.id,
      true,
      companyA.id,
      sql`SELECT id FROM jobs WHERE id = ${jobA.id}`
    );
    assert(otherTenantJobs === 0, "Client saw another tenant's job");
    const foreignCompanyInOtherOrg = await countVisible(
      sql,
      orgB.id,
      true,
      companyA.id,
      sql`SELECT id FROM jobs WHERE id = ${jobOther.id}`
    );
    assert(
      foreignCompanyInOtherOrg === 0,
      "Client company id from another tenant saw that tenant's job"
    );

    const clientBJobs = await countVisible(
      sql,
      orgA.id,
      true,
      companyB.id,
      sql`SELECT id FROM jobs WHERE id = ${jobA.id}`
    );
    assert(clientBJobs === 0, "Client B saw client A's job");

    for (const label of ["admin", "manager", "staff"] as const) {
      assert(
        (await asInternal(sql`SELECT id FROM jobs`)) === 2,
        `${label} did not see both companies' jobs`
      );
      assert(
        (await asInternal(sql`SELECT id FROM client_notes`)) === 2,
        `${label} did not see client notes`
      );
      assert(
        (await asInternal(sql`SELECT id FROM availability_requests`)) === 1,
        `${label} did not see availability`
      );
    }

    await sql.transaction([
      sql`SET LOCAL ROLE logiparty_app`,
      sessionConfig(sql, orgA.id, true, companyA.id),
      sql`
        INSERT INTO client_inventory_requests (
          org_id, client_company_id, requested_by_user_id, type, reason
        ) VALUES (${orgA.id}, ${companyA.id}, ${user.id}, 'add', 'own company')
      `,
    ]);

    let blocked = false;
    try {
      await sql.transaction([
        sql`SET LOCAL ROLE logiparty_app`,
        sessionConfig(sql, orgA.id, true, companyA.id),
        sql`
          INSERT INTO client_inventory_requests (
            org_id, client_company_id, requested_by_user_id, type, reason
          ) VALUES (${orgA.id}, ${companyB.id}, ${user.id}, 'add', 'other company')
        `,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/row-level security/i.test(message)) throw error;
      blocked = true;
    }
    assert(blocked, "Client inserted an inventory request for another company");

    console.log(
      "OK: client company isolation (same tenant, other tenant, notes, requests, internal)"
    );
  } finally {
    await sql`DELETE FROM jobs WHERE org_id IN (${orgA.id}, ${orgB.id})`;
    await sql`DELETE FROM client_inventory_requests WHERE org_id IN (${orgA.id}, ${orgB.id})`;
    await sql`DELETE FROM client_notes WHERE org_id IN (${orgA.id}, ${orgB.id})`;
    await sql`DELETE FROM client_inventory_items WHERE org_id IN (${orgA.id}, ${orgB.id})`;
    await sql`DELETE FROM availability_requests WHERE org_id IN (${orgA.id}, ${orgB.id})`;
    await sql`DELETE FROM fleet_vehicles WHERE org_id IN (${orgA.id}, ${orgB.id})`;
    await sql`DELETE FROM organizations WHERE id IN (${orgA.id}, ${orgB.id})`;
    await sql`DELETE FROM users WHERE id = ${user.id}`;
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
  const orgs = (await sql`
    SELECT id, slug FROM organizations
    ORDER BY (slug = 'nydac') DESC, slug
    LIMIT 1
  `) as { id: string; slug: string }[];
  const testOrg = orgs[0];
  if (!testOrg) {
    throw new Error("Need at least one organization — run npm run db:seed");
  }

  const probeSlug = `rls-probe-${Date.now()}`;
  const [probeOrg] = (await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name)
    VALUES (${probeSlug}, 'RLS Probe', '#000000', 'RLS Probe')
    RETURNING id, slug
  `) as { id: string; slug: string }[];

  try {
    await verifyCatalogRls(sql, testOrg, probeOrg);
    await verifyJobsRls(sql, testOrg, probeOrg);
    await verifyClientIsolation(sql);
    console.log("All integration checks passed.");
  } finally {
    await sql`DELETE FROM organizations WHERE id = ${probeOrg.id}`;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
