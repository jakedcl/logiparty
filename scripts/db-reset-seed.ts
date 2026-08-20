/**
 * Wipe seeded orgs (nydac + test + axis + legacy demo/acme/…) and re-run golden-path seed.
 *
 * Run: npm run db:reset-seed -- --confirm
 *
 * Deletes jobs first (FK: jobs.client_company_id RESTRICT), then organizations
 * (CASCADE org-scoped rows / memberships — users are NOT auto-deleted), then
 * seed-only users by email. Non-seed users are kept.
 *
 * After re-seed, `nydac`, `test`, and `axis` exist (fully populated).
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";
import { execSync } from "child_process";

/** Orgs wiped on reset. Seed recreates nydac + test + axis; others are legacy cleanup. */
const SEED_ORG_SLUGS = [
  "nydac",
  "test",
  "axis",
  "demo",
  "acme",
  "testtenant3pl",
] as const;

const SEED_USER_EMAILS = [
  // NYDAC cast
  "ed@test.test",
  "mike@test.test",
  "don@test.test",
  "paul@test.test",
  "tom@test.test",
  "rob@test.test",
  "jerome@test.test",
  "michaela@redbull.test",
  "dom@redbull.test",
  // NYDAC extra client portal users (Monster + Gotham Glow)
  "sara@monster.nydac.test",
  "lee@monster.nydac.test",
  "maya@gothamglow.test",
  "nick@gothamglow.test",
  // Test / Acme playground cast
  "boss@playground.test",
  "riley@playground.test",
  "chris@playground.test",
  "pat@playground.test",
  "jamie@playground.test",
  "nina@monster.test",
  "kai@monster.test",
  // Axis Global Staging cast
  "jordan@axis.test",
  "avery@axis.test",
  "casey@axis.test",
  "drew@axis.test",
  "blake@axis.test",
  "taylor@volt.test",
  "reese@volt.test",
  // Legacy cast (cleanup on reset — includes former demo OrgAdmin Devon)
  "admin@demo.test",
  "admin@test.test",
  "morgan@test.test",
  "sam@test.test",
  "dana@test.test",
  "alex@redbull.test",
  "rep1@redbull.test",
  "rep2@redbull.test",
  "admin@testtenant3pl.test",
  "morgan@testtenant3pl.test",
  "sam@testtenant3pl.test",
  "dana@testtenant3pl.test",
  "admin@acme.test",
  "morgan@acme.test",
  "sam@acme.test",
  "dana@acme.test",
] as const;

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

function dbTarget(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}/${u.pathname.slice(1)}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function resetAndSeed() {
  const confirmed = process.argv.includes("--confirm");
  if (!confirmed) {
    console.error(
      "Refusing to run without --confirm.\n\n  npm run db:reset-seed -- --confirm"
    );
    process.exit(1);
  }

  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required (.env.local)");
  }

  const target = dbTarget(url);
  console.log(`Target database: ${target}`);

  // Hard guard: never wipe Neon production (main) from this script.
  if (url.includes("ep-red-surf-apcicxpa")) {
    console.error(
      "\nREFUSING: DATABASE_URL looks like Neon production (main).\n" +
        "  Reset-seed is for the local Neon `dev` branch only.\n"
    );
    process.exit(1);
  }

  console.warn(
    "\n⚠️  If Vercel Production uses the SAME DATABASE_URL hostname as .env.local,\n" +
      "    this reset affects production too (seed orgs/jobs wiped).\n" +
      "    Compare hostnames in Vercel → Settings → Environment Variables before running.\n" +
      "    Use a separate Neon branch for local dev (see docs/STAGING.md).\n"
  );
  if (!url.includes("neon")) {
    console.warn(
      "WARNING: DATABASE_URL does not look like Neon. Double-check this is dev, not production."
    );
  }

  const sql = neon(url);

  const orgsBefore = await sql`
    SELECT slug, name FROM organizations
    WHERE slug = ANY(${SEED_ORG_SLUGS})
    ORDER BY slug
  `;
  const jobsBefore = await sql`
    SELECT o.slug, count(*)::int AS n
    FROM jobs j
    JOIN organizations o ON o.id = j.org_id
    WHERE o.slug = ANY(${SEED_ORG_SLUGS})
    GROUP BY o.slug
    ORDER BY o.slug
  `;
  const clientsBefore = await sql`
    SELECT o.slug, c.name
    FROM client_companies c
    JOIN organizations o ON o.id = c.org_id
    WHERE o.slug = ANY(${SEED_ORG_SLUGS})
    ORDER BY o.slug, c.name
  `;
  const seedUsersBefore = await sql`
    SELECT email FROM users
    WHERE email = ANY(${SEED_USER_EMAILS})
    ORDER BY email
  `;

  console.log("\n--- Before reset ---");
  console.log("Orgs:", orgsBefore.length ? orgsBefore : "(none)");
  console.log("Jobs:", jobsBefore.length ? jobsBefore : "(none)");
  console.log("Client companies:", clientsBefore.length ? clientsBefore : "(none)");
  console.log(
    "Seed users:",
    seedUsersBefore.length
      ? seedUsersBefore.map((u) => u.email).join(", ")
      : "(none)"
  );

  const deletedJobs = await sql`
    DELETE FROM jobs j
    USING organizations o
    WHERE j.org_id = o.id AND o.slug = ANY(${SEED_ORG_SLUGS})
    RETURNING j.id
  `;

  const deletedOrgs = await sql`
    DELETE FROM organizations
    WHERE slug = ANY(${SEED_ORG_SLUGS})
    RETURNING slug, name
  `;

  const deletedUsers = await sql`
    DELETE FROM users
    WHERE email = ANY(${SEED_USER_EMAILS})
    RETURNING email
  `;

  console.log("\n--- Deleted ---");
  console.log(`Jobs: ${deletedJobs.length}`);
  console.log(
    "Orgs:",
    deletedOrgs.map((o) => `${o.slug} (${o.name})`).join(", ") || "(none)"
  );
  console.log(
    "Seed users:",
    deletedUsers.map((u) => u.email).join(", ") || "(none)"
  );

  console.log("\n--- Re-seeding ---");
  execSync("npm run db:seed", { stdio: "inherit", cwd: process.cwd() });

  const orgsAfter = await sql`
    SELECT slug, name, logo_url FROM organizations
    WHERE slug = ANY(${SEED_ORG_SLUGS})
    ORDER BY slug
  `;
  const clientsAfter = await sql`
    SELECT o.slug, c.name
    FROM client_companies c
    JOIN organizations o ON o.id = c.org_id
    WHERE o.slug = ANY(${SEED_ORG_SLUGS})
    ORDER BY o.slug, c.name
  `;
  const inventoryAfter = await sql`
    SELECT o.slug, i.sku, i.name
    FROM inventory_items i
    JOIN organizations o ON o.id = i.org_id
    WHERE o.slug IN ('nydac', 'test', 'axis')
    ORDER BY o.slug, i.sku
  `;
  const fleetAfter = await sql`
    SELECT o.slug, f.name, f.plate
    FROM fleet_vehicles f
    JOIN organizations o ON o.id = f.org_id
    WHERE o.slug IN ('nydac', 'test', 'axis')
    ORDER BY o.slug, f.name
  `;
  const jobsAfter = await sql`
    SELECT o.slug, j.name, j.status
    FROM jobs j
    JOIN organizations o ON o.id = j.org_id
    WHERE o.slug IN ('nydac', 'test', 'axis')
    ORDER BY o.slug, j.name
  `;

  console.log("\n--- After seed ---");
  console.log("Orgs:", orgsAfter);
  console.log("Client companies:", clientsAfter);
  console.log("Inventory:", inventoryAfter);
  console.log("Fleet:", fleetAfter);
  console.log("Sample jobs:", jobsAfter);
  console.log(
    "\nNon-seed users preserved (e.g. personal accounts) — re-invite to nydac/test/axis if needed."
  );
}

resetAndSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});
