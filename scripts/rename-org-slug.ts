/** One-off: rename org slug in DB. Usage: npx tsx scripts/rename-org-slug.ts from to */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";

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

async function main() {
  const from = process.argv[2];
  const to = process.argv[3];
  const name = process.argv[4] ?? to;
  if (!from || !to) throw new Error("Usage: npx tsx scripts/rename-org-slug.ts <from> <to> [displayName]");
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = neon(url);
  const rows = await sql`
    UPDATE organizations
    SET slug = ${to}, name = ${name}, email_from_name = ${name}
    WHERE slug = ${from}
    RETURNING slug, name
  `;
  console.log(rows.length ? `Renamed: ${from} → ${rows[0].slug} (${rows[0].name})` : `No org with slug ${from}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
