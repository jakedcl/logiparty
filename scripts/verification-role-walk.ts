/**
 * Post-polish verification: HTTP checks for each role on local tenant.
 * Usage: BASE_URL=http://nydac.localhost:3000 npx tsx scripts/verification-role-walk.ts
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL ?? "http://nydac.localhost:3000";
const PASSWORD = "password123";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim();
  }
}

function cookieJar() {
  const jar = new Map<string, string>();
  return {
    absorb(res: Response) {
      for (const c of res.headers.getSetCookie?.() ?? []) {
        const part = c.split(";")[0];
        const eq = part.indexOf("=");
        if (eq < 1) continue;
        jar.set(part.slice(0, eq), part.slice(eq + 1));
      }
    },
    header: () => [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
    hasSession: () => jar.has("authjs.session-token"),
  };
}

async function login(email: string, orgSlug = "nydac") {
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
      orgSlug,
      redirect: "false",
      callbackUrl: `${BASE}/dashboard`,
    }),
  });
  jar.absorb(loginRes);
  if (!jar.hasSession()) {
    throw new Error(`Login failed: ${email}`);
  }
  return jar;
}

async function get(jar: ReturnType<typeof cookieJar>, path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: jar.header() },
    redirect: "manual",
  });
  const html = await res.text();
  return { status: res.status, location: res.headers.get("location"), html };
}

function visibleHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

function assertNoLogiparty(html: string, label: string) {
  const v = visibleHtml(html);
  if (/Logiparty/i.test(v)) {
    throw new Error(`${label}: visible HTML contains Logiparty`);
  }
}

function pass(msg: string) {
  console.log(`PASS: ${msg}`);
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

async function searchApi(jar: ReturnType<typeof cookieJar>, q: string, scope?: string) {
  const params = new URLSearchParams({ q });
  if (scope) params.set("scope", scope);
  const res = await fetch(`${BASE}/api/search?${params}`, {
    headers: { cookie: jar.header() },
  });
  if (!res.ok) fail(`search API ${res.status} for q=${q}`);
  const data = (await res.json()) as { groups?: { items: unknown[] }[] };
  const count = (data.groups ?? []).reduce((n, g) => n + g.items.length, 0);
  return count;
}

async function main() {
  loadEnvLocal();
  let failed = 0;
  const check = (ok: boolean, msg: string) => {
    if (ok) pass(msg);
    else {
      console.error(`FAIL: ${msg}`);
      failed++;
    }
  };

  const ed = await login("ed@test.test");

  const notFoundAuthed = await get(ed, "/this-route-does-not-exist-qa");
  check(
    notFoundAuthed.status === 404 &&
      notFoundAuthed.html.includes("Page not found") &&
      notFoundAuthed.html.includes("New York Design and Construction"),
    "Tenant 404 is branded (NYDAC, authenticated)"
  );
  assertNoLogiparty(notFoundAuthed.html, "tenant 404");

  const edDash = await get(ed, "/dashboard");
  check(edDash.status === 200, "Org admin dashboard loads");
  assertNoLogiparty(edDash.html, "ed dashboard");
  const edSearch = await searchApi(ed, "Red Bull");
  check(edSearch > 0, "Org admin search returns results");

  const reports = await get(ed, "/dashboard/reports");
  check(reports.status === 200 && reports.html.includes("Reports"), "Reports page renders");
  assertNoLogiparty(reports.html, "reports");

  const billing = await get(ed, "/dashboard/settings");
  check(
    billing.status === 200 &&
      billing.html.toLowerCase().includes("billing") &&
      !/sk_live_|sk_test_/.test(billing.html),
    "Billing section on settings OK without Stripe keys"
  );

  const help = await get(ed, "/dashboard/help");
  check(help.status === 200 && help.html.includes("Help"), "Help / checklist page loads");

  const mike = await login("mike@test.test");
  check((await searchApi(mike, "Dolly")) > 0, "Manager search returns results");
  const mikeJobs = await get(mike, "/dashboard/jobs");
  check(mikeJobs.status === 200, "Manager can open Jobs");

  const paul = await login("paul@test.test");
  const paulDash = await get(paul, "/dashboard");
  check(
    paulDash.status === 307 &&
      Boolean(paulDash.location?.includes("/dashboard/my-jobs")),
    "Crew-only /dashboard redirects to My Jobs"
  );
  const paulJobs = await get(paul, "/dashboard/jobs");
  check(
    paulJobs.status === 307 &&
      Boolean(paulJobs.location?.includes("/dashboard/my-jobs")),
    "Crew-only cannot open Jobs list"
  );
  check((await searchApi(paul, "Festival")) >= 0, "Crew search API responds");

  const client = await login("michaela@redbull.test");
  const portal = await get(client, "/portal");
  check(portal.status === 200, "Client portal home loads");
  assertNoLogiparty(portal.html, "portal");
  const portalSearch = await searchApi(client, "RB", "portal");
  check(portalSearch >= 0, "Client portal search API responds");

  if (failed) process.exit(1);
  console.log(`\n${failed === 0 ? "All role verification checks passed." : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
