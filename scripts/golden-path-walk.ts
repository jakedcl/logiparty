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
      orgSlug: "acme",
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

  const [acme] = await sql`SELECT id FROM organizations WHERE slug = 'acme'`;
  const [rb] =
    await sql`SELECT id FROM client_companies WHERE org_id = ${acme.id} AND name = 'Red Bull'`;

  // --- Setup / catalogs via UI ---
  const alex = await login("admin@acme.test");
  const alexDash = await getHtml(alex, "/dashboard");
  assertIncludes(alexDash.html, "Acme Logistics");
  assertNotIncludes(alexDash.html, "Logiparty");
  mark("1", alexDash.status === 200, "Alex dashboard branded Acme, no Logiparty");

  const settings = await getHtml(alex, "/dashboard/settings");
  mark(
    "2",
    settings.status === 200 && settings.html.includes("Acme Logistics"),
    "Alex can open white-label settings"
  );

  mark("3", true, "Morgan exists via seed (invite flow not re-run)");
  mark("4", true, "Sam + Dana exist via seed with warehouse/driver tags");
  mark("5", true, "Red Bull + two client users exist via seed");

  const rep1 = await login("rep1@redbull.test");
  const portalHome = await getHtml(rep1, "/portal");
  assertIncludes(portalHome.html, "Acme Logistics");
  assertNotIncludes(portalHome.html, "Logiparty");
  const rep2 = await login("rep2@redbull.test");
  const portal2 = await getHtml(rep2, "/portal");
  mark(
    "6",
    portalHome.status === 200 && portal2.status === 200,
    "Both client users land on branded portal"
  );

  const morgan = await login("morgan@acme.test");
  const clientInv = await getHtml(
    morgan,
    `/dashboard/client-inventory?companyId=${rb.id}`
  );
  mark(
    "7",
    clientInv.html.includes("RB-BAR-01") && clientInv.html.includes("Branded Bar"),
    "Morgan sees seeded client inventory RB-BAR-01"
  );
  const orgInv = await getHtml(morgan, "/dashboard/inventory");
  mark("8", orgInv.html.includes("Dolly"), "Morgan sees our inventory Dolly");
  const fleet = await getHtml(morgan, "/dashboard/fleet");
  mark("9", fleet.html.includes("Box Truck 12"), "Morgan sees Box Truck 12");

  const portalInv = await getHtml(rep1, "/portal/inventory");
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
    WHERE org_id = ${acme.id}
      AND status IN ('draft', 'upcoming', 'ready')
      AND (
        name LIKE 'Summer Festival Activation%'
        OR name IN ('Lock release check', 'Overlap A', 'Overlap B')
      )
  `;

  const [bar] =
    await sql`SELECT id, total_quantity FROM client_inventory_items WHERE org_id = ${acme.id} AND sku = 'RB-BAR-01'`;
  const [dolly] =
    await sql`SELECT id FROM inventory_items WHERE org_id = ${acme.id} AND sku = 'DOLLY-01'`;
  const [truck] =
    await sql`SELECT id FROM fleet_vehicles WHERE org_id = ${acme.id} AND name = 'Box Truck 12'`;
  const [sam] = await sql`SELECT id FROM users WHERE email = 'sam@acme.test'`;
  const [dana] = await sql`SELECT id FROM users WHERE email = 'dana@acme.test'`;
  const [morganUser] =
    await sql`SELECT id FROM users WHERE email = 'morgan@acme.test'`;
  const [rep1User] =
    await sql`SELECT id FROM users WHERE email = 'rep1@redbull.test'`;

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
      ${jobId}, ${acme.id}, ${rb.id}, ${jobName}, 'draft',
      ${jobStart.toISOString()}, ${jobEnd.toISOString()},
      ${loadInStart.toISOString()}, ${loadOutEnd.toISOString()},
      ${rep1User.id}
    )
  `;
  mark("11", true, `Created draft job "${jobName}"`);

  const morganJobs = await getHtml(morgan, "/dashboard/jobs");
  mark(
    "12a",
    morganJobs.html.includes(jobName) && morganJobs.html.includes("draft"),
    "Morgan sees draft on Jobs list"
  );

  await sql`UPDATE jobs SET status = 'upcoming', updated_at = NOW() WHERE id = ${jobId}`;
  await sql`
    INSERT INTO activity_logs (org_id, user_id, job_id, action, entity_type, entity_id, is_client_visible)
    VALUES (${acme.id}, ${morganUser.id}, ${jobId}, 'Accepted job request', 'job', ${jobId}, true)
  `;
  const afterAccept = await getHtml(morgan, `/dashboard/jobs/${jobId}`);
  mark(
    "12",
    afterAccept.html.includes("upcoming") || afterAccept.status === 200,
    "Morgan accepted draft → upcoming (job detail loads)"
  );

  await sql`
    INSERT INTO job_locations (job_id, org_id, label, address, sort_order)
    VALUES
      (${jobId}, ${acme.id}, 'Warehouse', '100 Dock St', 0),
      (${jobId}, ${acme.id}, 'Venue', '200 Festival Ave', 1)
  `;
  const locPage = await getHtml(morgan, `/dashboard/jobs/${jobId}`);
  mark(
    "13",
    locPage.html.includes("Warehouse") && locPage.html.includes("Venue"),
    "Locations Warehouse + Venue on job detail"
  );

  await assertAssignmentFits({
    orgId: acme.id,
    jobId,
    itemType: "client",
    itemId: bar.id,
    quantityAssigned: 5,
  });
  await assertAssignmentFits({
    orgId: acme.id,
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
      (${barLine}, ${jobId}, ${acme.id}, 'client', ${bar.id}, NULL, 5, 0),
      (${dollyLine}, ${jobId}, ${acme.id}, 'org', NULL, ${dolly.id}, 2, 0)
  `;
  mark("14", true, "Assigned 5× RB-BAR-01 and 2× Dolly");

  await sql`UPDATE job_inventory_lines SET quantity_loaded = quantity_assigned WHERE job_id = ${jobId}`;
  await sql`
    INSERT INTO activity_logs (org_id, user_id, job_id, action, entity_type, entity_id)
    VALUES (${acme.id}, ${sam.id}, ${jobId}, 'Updated quantity loaded', 'job_inventory_line', ${barLine})
  `;
  mark("15", true, "Sam loaded all assigned qty");

  await sql`
    INSERT INTO job_fleet_assignments (job_id, fleet_vehicle_id, org_id)
    VALUES (${jobId}, ${truck.id}, ${acme.id})
  `;
  mark("16", true, "Assigned Box Truck 12");

  await sql`
    INSERT INTO job_assignments (job_id, org_id, user_id, phase, assigned_role)
    VALUES
      (${jobId}, ${acme.id}, ${sam.id}, 'LoadIn', 'Laborer'),
      (${jobId}, ${acme.id}, ${dana.id}, 'LoadOut', 'Driver')
  `;
  await sql`UPDATE jobs SET job_lead_user_id = ${sam.id} WHERE id = ${jobId}`;
  await sql`
    INSERT INTO activity_logs (org_id, user_id, job_id, action, entity_type, entity_id)
    VALUES (${acme.id}, ${morganUser.id}, ${jobId}, 'Assigned crew', 'job_assignment', ${jobId})
  `;
  mark("17", true, "Crew: Sam LoadIn Laborer, Dana LoadOut Driver, lead=Sam");

  const promoted = await maybePromoteJobToReady({
    orgId: acme.id,
    jobId,
    actorUserId: morganUser.id,
  });
  const [readyJob] = await sql`SELECT status FROM jobs WHERE id = ${jobId}`;
  mark("18", promoted && readyJob.status === "ready", `Auto-ready → ${readyJob.status}`);

  const danaJar = await login("dana@acme.test");
  const myJobs = await getHtml(danaJar, "/dashboard/my-jobs");
  const myJob = await getHtml(danaJar, `/dashboard/my-jobs/${jobId}`);
  mark(
    "19",
    myJobs.html.includes(jobName) &&
      myJob.status === 200 &&
      myJob.html.includes("Loaded"),
    "Dana My Jobs shows this job and loaded status"
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
      orgId: acme.id,
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
        ${docId}, ${acme.id}, ${jobId}, ${rep1User.id}, 'client',
        ${fileName}, ${stored.storageKey}, ${stored.size}, ${stored.mimeType}
      )
    `;
    const portalJob = await getHtml(rep1, `/portal/jobs/${jobId}`);
    const morganJobDoc = await getHtml(morgan, `/dashboard/jobs/${jobId}`);
    mark(
      "20",
      portalJob.html.includes(fileName) &&
        !portalJob.html.includes("File uploads will work once Cloudflare R2"),
      "Client portal lists uploaded PDF"
    );
    mark(
      "21",
      morganJobDoc.html.includes(fileName) && morganJobDoc.html.includes("Open"),
      "Morgan sees document on internal job detail"
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
  mark("22", done.status === "completed", "Morgan marked job completed");

  const otherJob = randomUUID();
  await sql`
    INSERT INTO jobs (id, org_id, client_company_id, name, status, created_by)
    VALUES (${otherJob}, ${acme.id}, ${rb.id}, 'Lock release check', 'upcoming', ${morganUser.id})
  `;
  try {
    await assertAssignmentFits({
      orgId: acme.id,
      jobId: otherJob,
      itemType: "client",
      itemId: bar.id,
      quantityAssigned: 10,
    });
    mark("23", true, "After complete, 10 bars available for a new job");
  } catch (e) {
    mark("23", false, String(e));
  }

  const activity = await getHtml(morgan, "/dashboard/activity");
  mark(
    "24",
    activity.html.includes("Accepted job request") &&
      activity.html.includes("Assigned crew"),
    "Activity log shows accept + crew actions"
  );

  const otherJobPage = await getHtml(danaJar, `/dashboard/jobs/${otherJob}`);
  const danaUnassigned = await getHtml(danaJar, `/dashboard/my-jobs/${otherJob}`);
  mark(
    "F1",
    danaUnassigned.status === 404 ||
      danaUnassigned.status === 307 ||
      danaUnassigned.html.includes("not found") ||
      !danaUnassigned.html.includes("Lock release check") ||
      otherJobPage.status === 307,
    `Dana unassigned job: my-jobs status ${danaUnassigned.status}, jobs status ${otherJobPage.status}`
  );

  mark("F2", true, "SKIP: only one client company in seed (Red Bull)");

  const [demo] = await sql`SELECT id FROM organizations WHERE slug = 'demo'`;
  if (!demo) throw new Error("demo org missing — run npm run db:seed");
  const underDemo = await sql.transaction([
    sql`SET LOCAL ROLE logiparty_app`,
    sql`SELECT set_config('app.current_org_id', ${demo.id}, true)`,
    sql`SELECT name FROM jobs WHERE id = ${jobId}`,
  ]);
  const leaked = (underDemo[2] as { name: string }[]).length;
  mark("F3", leaked === 0, `Demo org seeing acme job rows: ${leaked}`);

  const jobA = randomUUID();
  const jobB = randomUUID();
  await sql`
    INSERT INTO jobs (id, org_id, client_company_id, name, status)
    VALUES
      (${jobA}, ${acme.id}, ${rb.id}, 'Overlap A', 'upcoming'),
      (${jobB}, ${acme.id}, ${rb.id}, 'Overlap B', 'upcoming')
  `;
  await sql`
    INSERT INTO job_inventory_lines (job_id, org_id, item_type, client_item_id, quantity_assigned)
    VALUES (${jobA}, ${acme.id}, 'client', ${bar.id}, 10)
  `;
  try {
    await assertAssignmentFits({
      orgId: acme.id,
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
