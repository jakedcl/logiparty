import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

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

/** Split SQL on `;` while keeping DO $body$ ... $body$ blocks intact. */
function splitStatements(content: string): string[] {
  const parts: string[] = [];
  let buf = "";
  let inBody = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") && !inBody) continue;
    if (trimmed.includes("$body$")) inBody = !inBody;
    buf += `${line}\n`;
    if (!inBody && trimmed.endsWith(";")) {
      const stmt = buf.trim();
      if (stmt.length > 0) parts.push(stmt);
      buf = "";
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = neon(url);
  const dir = join(process.cwd(), "lib/db/migrations");
  const only = process.argv.slice(2);
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => (only.length === 0 ? true : only.includes(f)));

  for (const file of files) {
    const content = readFileSync(join(dir, file), "utf8");
    const statements = splitStatements(content);
    console.log(`Running ${file} (${statements.length} statements)...`);
    for (const statement of statements) {
      await sql.query(statement.endsWith(";") ? statement : `${statement};`);
    }
  }
  console.log("Migrations complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
