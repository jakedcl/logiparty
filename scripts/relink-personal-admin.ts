/**
 * Re-link an existing personal account as NYDAC org admin (idempotent).
 *
 * Run: npm run db:relink-admin
 * Or:  PERSONAL_ADMIN_EMAIL=you@example.com npm run db:relink-admin
 *
 * Safe to re-run. Does not create users — only adds org_memberships row.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";

const DEFAULT_EMAIL = "jakedcl73@gmail.com";

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

async function relink() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required (.env.local)");

  const email = process.env.PERSONAL_ADMIN_EMAIL ?? DEFAULT_EMAIL;
  const sql = neon(url);

  const users = await sql`
    SELECT id, email, first_name, last_name FROM users WHERE email = ${email}
  `;
  if (users.length === 0) {
    console.log(`No user found for ${email}. Sign up or invite first, then re-run.`);
    return;
  }

  const result = await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, true, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'nydac' AND u.email = ${email}
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = true,
      is_manager = true
    RETURNING org_id, user_id
  `;

  console.log(
    result.length
      ? `Linked ${email} as NYDAC org admin (org_id ${result[0].org_id}).`
      : `No change for ${email}.`
  );
}

relink().catch((e) => {
  console.error(e);
  process.exit(1);
});
