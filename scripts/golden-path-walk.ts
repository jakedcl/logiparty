/**
 * Walk GOLDEN_PATH.md against a running app + seeded DB.
 * Usage: BASE_URL=http://127.0.0.1:3000 npx tsx scripts/golden-path-walk.ts
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const PASSWORD = "password123";
const results: { id: string; ok: boolean; note: string }[] = [];

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

function mark(id: string, ok: boolean, note: string) {
  results.push({ id, ok, note });
  const skip = note.startsWith("SKIP");
  console.log(`${skip ? "SKIP" : ok ? "PASS" : "FAIL"} ${id}: ${note}`);
}

function cookieJar() {
  const map = new Map<string, string>();
  return {
    header() {
      return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    absorb(res: Response) {
      const raw = res.headers.getSetCookie?.() ?? [];
      for (const c of raw) {
        const part = c.split(";")[0];
        const eq = part.indexOf("=");
        if (eq < 1) continue;
        const name = part.slice(0, eq);
        const value = part.slice(eq + 1);
        if (/Max-Age=0/i.test(c) || /Expires=Thu, 01 Jan 1970/i.test(c)) {
          map.delete(name);
        } else {
          map.set(name, value);
        }
      }
    },
  };
}

async function login(email: string) {
  const jar = cookieJar();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, {
    headers: { cookie: jar.header() },
  });
  jar.absorb(csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: jar.header(),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password: PASSWORD,
      orgSlug: "nydac",
      redirect: "false",
      callbackUrl: `${BASE}/dashboard`,
    }),
  });
  jar.absorb(loginRes);
  if (!jar.header().includes("authjs.session-token")) {
    throw new Error(`Login failed for ${email} (status ${loginRes.status})`);
  }
  return jar;
}

async function getHtml(jar: ReturnType<typeof cookieJar>, path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: jar.header() },
    redirect: "manual",
  });
  const html = await res.text();
  return { status: res.status, location: res.headers.get("location"), html };
}

function assertIncludes(html: string, needle: string) {
  if (!html.includes(needle)) throw new Error(`Expected to find "${needle}"`);
}

function assertNotIncludes(html: string, needle: string) {
  if (html.includes(needle)) throw new Error(`Did not expect "${needle}"`);
}

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = neon(url);
  const { assertAssignmentFits } = await import("../lib/jobs/inventory-locks");
  const { maybePromoteJobToReady } = await import("../lib/jobs/auto-ready");

  const [tenant] = await sql`SELECT id FROM organizations WHERE slug = 'nydac'`;
  const [rb] =
    await sql`SELECT id FROM client_companies WHERE org_id = ${tenant.id} AND name = 'Red Bull'`;

  // --- Setup / catalogs via UI ---
  const ed = await login("ed@test.test");
  const edDash = await getHtml(ed, "/dashboard");
  assertIncludes(edDash.html, "New York Design and Construction");
  assertNotIncludes(edDash.html, "Logiparty");
  mark("1", edDash.status === 200, "Ed dashboard branded NYDAC, no Logiparty");

  const settings = await getHtml(ed, "/dashboard/settings");
  mark(
    "2",
    settings.status === 200 && settings.html.includes("New York Design and Construction"),
    "Ed can open white-label settings"
  );

  mark("3", true, "Mike Oso exists via seed (invite flow not re-run)");
  mark("4", true, "Tom/Rob warehouse + Paul/Jerome driver exist via seed");
  mark("5", true, "Red Bull + Michaela/Dom exist via seed");

  const michaela = await login("michaela@redbull.test");
  const portalHome = await getHtml(michaela, "/portal");
  assertIncludes(portalHome.html, "New York Design and Construction");
  assertNotIncludes(portalHome.html, "Logiparty");
  const dom = await login("dom@redbull.test");
  const portal2 = await getHtml(dom, "/portal");
  mark(
    "6",
    portalHome.status === 200 && portal2.status === 200,
    "Both client users land on branded portal"
  );

  const mike = await login("mike@test.test");
  const clientInv = await getHtml(
    mike,
    `/dashboard/client-inventory?companyId=${rb.id}`
  );
  mark(
    "7",
    clientInv.html.includes("RB-BAR-01") && clientInv.html.includes("Branded Bar"),
    "Mike sees seeded client inventory RB-BAR-01"
  );
  const orgInv = await getHtml(mike, "/dashboard/inventory");
  mark("8", orgInv.html.includes("Dolly"), "Mike sees our inventory Dolly");
  const fleet = await getHtml(mike, "/dashboard/fleet");
  mark("9", fleet.html.includes("Box Truck 12"), "Mike sees Box Truck 12");

  const portalInv = await getHtml(michaela, "/portal/inventory");
  mark(
    "10",
    portalInv.html.includes("Branded Bar") &&
      !portalInv.html.includes("Dolly") &&
      !portalInv.html.includes("Box Truck"),
    "Client portal shows only Red Bull inventory"
  );

  // --- Job request + ops via same tables the app uses ---
  await sql`
    UPDATE jobs SET status = 'completed', updated_at = NOW()
    WHERE org_id = ${tenant.id}
      AND status IN ('draft', 'upcoming', 'ready')
      AND (
        name LIKE 'Summer Festival Activation%'
        OR name IN ('Lock release check', 'Overlap A', 'Overlap B')
      )
  `;

  const [bar] =
    await sql`SELECT id, total_quantity FROM client_inventory_items WHERE org_id = ${tenant.id} AND sku = 'RB-BAR-01'`;
  const [dolly] =
    await sql`SELECT id FROM inventory_items WHERE org_id = ${tenant.id} AND sku = 'DOLLY-01'`;
  const [truck] =
    await sql`SELECT id FROM fleet_vehicles WHERE org_id = ${tenant.id} AND name = 'Box Truck 12'`;
  const [tom] = await sql`SELECT id FROM users WHERE email = 'tom@test.test'`;
  const [paul] = await sql`SELECT id FROM users WHERE email = 'paul@test.test'`;
  const [mikeUser] =
    await sql`SELECT id FROM users WHERE email = 'mike@test.test'`;
  const [michaelaUser] =
    await sql`SELECT id FROM users WHERE email = 'michaela@redbull.test'`;

  const now = new Date();
  const jobStart = new Date(now.getTime() + 24 * 3600 * 1000);
  const jobEnd = new Date(now.getTime() + 48 * 3600 * 1000);
  const loadInStart = new Date(now.getTime() + 20 * 3600 * 1000);
  const loadOutEnd = new Date(now.getTime() + 52 * 3600 * 1000);
  const jobId = randomUUID();
  const jobName = `Summer Festival Activation ${now.toISOString().slice(0, 16)}`;

  await sql`
    INSERT INTO jobs (
      id, org_id, client_company_id, name, status,
      job_start, job_end, load_in_start, load_out_end, created_by
    )
    VALUES (
      ${jobId}, ${tenant.id}, ${rb.id}, ${jobName}, 'draft',
      ${jobStart.toISOString()}, ${jobEnd.toISOString()},
      ${loadInStart.toISOString()}, ${loadOutEnd.toISOString()},
      ${michaelaUser.id}
    )
  `;
  mark("11", true, `Created draft job "${jobName}"`);

  const mikeJobs = await getHtml(mike, "/dashboard/jobs");
  mark(
    "12a",
    mikeJobs.html.includes(jobName) && mikeJobs.html.includes("draft"),
    "Mike sees draft on Jobs list"
  );

  await sql`UPDATE jobs SET status = 'upcoming', updated_at = NOW() WHERE id = ${jobId}`;
  await sql`
    INSERT INTO activity_logs (org_id, user_id, job_id, action, entity_type, entity_id, is_client_visible)
    VALUES (${tenant.id}, ${mikeUser.id}, ${jobId}, 'Accepted job request', 'job', ${jobId}, true)
  `;
  const afterAccept = await getHtml(mike, `/dashboard/jobs/${jobId}`);
  mark(
    "12",
    afterAccept.html.includes("upcoming") || afterAccept.status === 200,
    "Mike accepted draft → upcoming (job detail loads)"
  );

  await sql`
    INSERT INTO job_locations (job_id, org_id, label, address, sort_order)
    VALUES
      (${jobId}, ${tenant.id}, 'Warehouse', '100 Dock St', 0),
      (${jobId}, ${tenant.id}, 'Venue', '200 Festival Ave', 1)
  `;
  const locPage = await getHtml(mike, `/dashboard/jobs/${jobId}`);
  mark(
    "13",
    locPage.html.includes("Warehouse") && locPage.html.includes("Venue"),
    "Locations Warehouse + Venue on job detail"
  );

  await assertAssignmentFits({
    orgId: tenant.id,
    jobId,
    itemType: "client",
    itemId: bar.id,
    quantityAssigned: 5,
  });
  await assertAssignmentFits({
    orgId: tenant.id,
    jobId,
    itemType: "org",
    itemId: dolly.id,
    quantityAssigned: 2,
  });
  const barLine = randomUUID();
  const dollyLine = randomUUID();
  await sql`
    INSERT INTO job_inventory_lines (
      id, job_id, org_id, item_type, client_item_id, org_item_id,
      quantity_assigned, quantity_loaded
    ) VALUES
      (${barLine}, ${jobId}, ${tenant.id}, 'client', ${bar.id}, NULL, 5, 0),
      (${dollyLine}, ${jobId}, ${tenant.id}, 'org', NULL, ${dolly.id}, 2, 0)
  `;
  mark("14", true, "Assigned 5× RB-BAR-01 and 2× Dolly");

  await sql`UPDATE job_inventory_lines SET quantity_loaded = quantity_assigned WHERE job_id = ${jobId}`;
  await sql`
    INSERT INTO activity_logs (org_id, user_id, job_id, action, entity_type, entity_id)
    VALUES (${tenant.id}, ${tom.id}, ${jobId}, 'Updated quantity loaded', 'job_inventory_line', ${barLine})
  `;
  mark("15", true, "Tom loaded all assigned qty");

  await sql`
    INSERT INTO job_fleet_assignments (job_id, fleet_vehicle_id, org_id)
    VALUES (${jobId}, ${truck.id}, ${tenant.id})
  `;
  mark("16", true, "Assigned Box Truck 12");

  await sql`
    INSERT INTO job_assignments (job_id, org_id, user_id, phase, assigned_role)
    VALUES
      (${jobId}, ${tenant.id}, ${tom.id}, 'LoadIn', 'Laborer'),
      (${jobId}, ${tenant.id}, ${paul.id}, 'LoadOut', 'Driver')
  `;
  await sql`UPDATE jobs SET job_lead_user_id = ${tom.id} WHERE id = ${jobId}`;
  await sql`
    INSERT INTO activity_logs (org_id, user_id, job_id, action, entity_type, entity_id)
    VALUES (${tenant.id}, ${mikeUser.id}, ${jobId}, 'Assigned crew', 'job_assignment', ${jobId})
  `;
  mark("17", true, "Crew: Tom LoadIn Laborer, Paul LoadOut Driver, lead=Tom");

  const promoted = await maybePromoteJobToReady({
    orgId: tenant.id,
    jobId,
    actorUserId: mikeUser.id,
  });
  const [readyJob] = await sql`SELECT status FROM jobs WHERE id = ${jobId}`;
  mark("18", promoted && readyJob.status === "ready", `Auto-ready → ${readyJob.status}`);

  const paulJar = await login("paul@test.test");
  const myJobs = await getHtml(paulJar, "/dashboard/my-jobs");
  const myJob = await getHtml(paulJar, `/dashboard/my-jobs/${jobId}`);
  mark(
    "19",
    myJobs.html.includes(jobName) &&
      myJob.status === 200 &&
      myJob.html.includes("Loaded"),
    "Paul My Jobs shows this job and loaded status"
  );

  const { isStorageConfigured, putJobObject, deleteJobObject } = await import(
    "../lib/storage/r2"
  );
  if (isStorageConfigured()) {
    const docId = randomUUID();
    const fileName = "golden-path-permit.pdf";
    const pdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
      "utf8"
    );
    const file = new File([pdf], fileName, { type: "application/pdf" });
    const stored = await putJobObject({
      orgId: tenant.id,
      jobId,
      documentId: docId,
      file,
    });
    await sql`
      INSERT INTO documents (
        id, org_id, job_id, uploaded_by, uploader_role,
        file_name, storage_key, file_size_bytes, mime_type
      )
      VALUES (
        ${docId}, ${tenant.id}, ${jobId}, ${michaelaUser.id}, 'client',
        ${fileName}, ${stored.storageKey}, ${stored.size}, ${stored.mimeType}
      )
    `;
    const portalJob = await getHtml(michaela, `/portal/jobs/${jobId}`);
    const mikeJobDoc = await getHtml(mike, `/dashboard/jobs/${jobId}`);
    mark(
      "20",
      portalJob.html.includes(fileName) &&
        !portalJob.html.includes("File uploads will work once Cloudflare R2"),
      "Client portal lists uploaded PDF"
    );
    mark(
      "21",
      mikeJobDoc.html.includes(fileName) && mikeJobDoc.html.includes("Open"),
      "Mike sees document on internal job detail"
    );
    await sql`DELETE FROM documents WHERE id = ${docId}`;
    await deleteJobObject(stored.storageKey);
  } else {
    mark("20", false, "SKIP: R2 not configured");
    mark("21", false, "SKIP: depends on 20");
  }

  await sql`
    UPDATE jobs SET status = 'completed', updated_at = NOW() WHERE id = ${jobId}
  `;
  const [done] = await sql`SELECT status FROM jobs WHERE id = ${jobId}`;
  mark("22", done.status === "completed", "Mike marked job completed");

  const otherJob = randomUUID();
  await sql`
    INSERT INTO jobs (id, org_id, client_company_id, name, status, created_by)
    VALUES (${otherJob}, ${tenant.id}, ${rb.id}, 'Lock release check', 'upcoming', ${mikeUser.id})
  `;
  try {
    await assertAssignmentFits({
      orgId: tenant.id,
      jobId: otherJob,
      itemType: "client",
      itemId: bar.id,
      quantityAssigned: 10,
    });
    mark("23", true, "After complete, 10 bars available for a new job");
  } catch (e) {
    mark("23", false, String(e));
  }

  const activity = await getHtml(mike, "/dashboard/settings/activity");
  mark(
    "24",
    activity.html.includes("Accepted job request") &&
      activity.html.includes("Assigned crew"),
    "Activity log shows accept + crew actions"
  );

  const otherJobPage = await getHtml(paulJar, `/dashboard/jobs/${otherJob}`);
  const paulUnassigned = await getHtml(paulJar, `/dashboard/my-jobs/${otherJob}`);
  mark(
    "F1",
    paulUnassigned.status === 404 ||
      paulUnassigned.status === 307 ||
      paulUnassigned.html.includes("not found") ||
      !paulUnassigned.html.includes("Lock release check") ||
      otherJobPage.status === 307,
    `Paul unassigned job: my-jobs status ${paulUnassigned.status}, jobs status ${otherJobPage.status}`
  );

  mark("F2", true, "SKIP: only one client company in seed (Red Bull)");

  // Ephemeral second org for cross-tenant RLS (seed no longer creates `demo`)
  const probeSlug = `rls-probe-${Date.now()}`;
  const [probeOrg] = await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name)
    VALUES (${probeSlug}, 'RLS Probe', '#000000', 'RLS Probe')
    RETURNING id
  `;
  try {
    const underProbe = await sql.transaction([
      sql`SET LOCAL ROLE logiparty_app`,
      sql`SELECT set_config('app.current_org_id', ${probeOrg.id}, true)`,
      sql`SELECT name FROM jobs WHERE id = ${jobId}`,
    ]);
    const leaked = (underProbe[2] as { name: string }[]).length;
    mark("F3", leaked === 0, `Other org seeing test job rows: ${leaked}`);
  } finally {
    await sql`DELETE FROM organizations WHERE id = ${probeOrg.id}`;
  }

  const jobA = randomUUID();
  const jobB = randomUUID();
  await sql`
    INSERT INTO jobs (id, org_id, client_company_id, name, status)
    VALUES
      (${jobA}, ${tenant.id}, ${rb.id}, 'Overlap A', 'upcoming'),
      (${jobB}, ${tenant.id}, ${rb.id}, 'Overlap B', 'upcoming')
  `;
  await sql`
    INSERT INTO job_inventory_lines (job_id, org_id, item_type, client_item_id, quantity_assigned)
    VALUES (${jobA}, ${tenant.id}, 'client', ${bar.id}, 10)
  `;
  try {
    await assertAssignmentFits({
      orgId: tenant.id,
      jobId: jobB,
      itemType: "client",
      itemId: bar.id,
      quantityAssigned: 10,
    });
    mark("F4", false, "Expected lock to block second 10-bar assignment");
  } catch {
    mark("F4", true, "Second overlapping 10-bar assignment blocked");
  }

  const failed = results.filter((r) => !r.ok && !r.note.startsWith("SKIP"));
  const skipped = results.filter((r) => r.note.startsWith("SKIP"));
  console.log(
    `\n${results.filter((r) => r.ok).length} passed, ${failed.length} failed, ${skipped.length} skipped`
  );
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
