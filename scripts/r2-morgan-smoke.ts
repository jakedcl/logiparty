/**
 * End-to-end: client uploads doc → Mike sees it on internal job page.
 * Usage: npx tsx scripts/r2-morgan-smoke.ts
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PASSWORD = "password123";
const FILE_NAME = "golden-path-permit.pdf";

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
        map.set(part.slice(0, eq), part.slice(eq + 1));
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
    throw new Error(`Login failed for ${email}`);
  }
  return jar;
}

async function getHtml(jar: ReturnType<typeof cookieJar>, path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: jar.header() },
    redirect: "manual",
  });
  return { status: res.status, html: await res.text() };
}

async function main() {
  loadEnvLocal();
  const { isStorageConfigured, putJobObject, deleteJobObject } = await import(
    "../lib/storage/r2"
  );
  if (!isStorageConfigured()) {
    console.error("FAIL: R2 env vars not configured");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = neon(url);

  const [tenant] = await sql`SELECT id FROM organizations WHERE slug = 'nydac'`;
  const [job] = await sql`
    SELECT j.id FROM jobs j
    JOIN client_companies c ON c.id = j.client_company_id
    WHERE j.org_id = ${tenant.id} AND c.name = 'Red Bull'
      AND j.status IN ('upcoming', 'ready', 'draft')
    ORDER BY j.created_at DESC
    LIMIT 1
  `;
  if (!job) throw new Error("No Red Bull job found — run golden-path walk or create a job first");

  const [michaela] =
    await sql`SELECT id FROM users WHERE email = 'michaela@redbull.test'`;
  const docId = randomUUID();
  const pdf = Buffer.from(
    "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
    "utf8"
  );
  const file = new File([pdf], FILE_NAME, { type: "application/pdf" });

  const stored = await putJobObject({
    orgId: tenant.id,
    jobId: job.id,
    documentId: docId,
    file,
  });

  await sql`
    INSERT INTO documents (
      id, org_id, job_id, uploaded_by, uploader_role,
      file_name, storage_key, file_size_bytes, mime_type
    )
    VALUES (
      ${docId}, ${tenant.id}, ${job.id}, ${michaela.id}, 'client',
      ${FILE_NAME}, ${stored.storageKey}, ${stored.size}, ${stored.mimeType}
    )
  `;

  const michaelaJar = await login("michaela@redbull.test");
  const portal = await getHtml(michaelaJar, `/portal/jobs/${job.id}`);
  const mikeJar = await login("mike@test.test");
  const internal = await getHtml(mikeJar, `/dashboard/jobs/${job.id}`);

  const portalOk =
    portal.status === 200 &&
    portal.html.includes(FILE_NAME) &&
    !portal.html.includes("File uploads will work once Cloudflare R2");
  const mikeOk =
    internal.status === 200 &&
    internal.html.includes(FILE_NAME) &&
    internal.html.includes("Open");

  console.log(portalOk ? "PASS" : "FAIL", "Client portal lists uploaded PDF");
  console.log(mikeOk ? "PASS" : "FAIL", "Mike sees document on internal job detail");

  await sql`DELETE FROM documents WHERE id = ${docId}`;
  await deleteJobObject(stored.storageKey);

  if (!portalOk || !mikeOk) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
