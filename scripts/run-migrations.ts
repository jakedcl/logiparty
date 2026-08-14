import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = neon(url);
  const dir = join(process.cwd(), "lib/db/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const content = readFileSync(join(dir, file), "utf8");
    const statements = content
      .split(/;\s*\n/)
      .map((s) => s.replace(/^--[^\n]*\n/gm, "").trim())
      .filter((s) => s.length > 0);
    console.log(`Running ${file} (${statements.length} statements)...`);
    for (const statement of statements) {
      await sql.query(`${statement};`);
    }
  }
  console.log("Migrations complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
