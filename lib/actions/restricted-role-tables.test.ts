import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

/**
 * The restricted `logiparty_app` role (used by withOrgQuery / withOrgQueries)
 * has no privileges on `organizations`, `users` or `org_memberships`
 * (migration 0009). Those tables must be read and written with the plain `db`
 * client (see lib/org/organization.ts). A query on them inside a
 * `(database) => ...` callback fails at runtime with "permission denied", and
 * unit tests with a mocked database never see it. This guards the pattern.
 */
const FORBIDDEN =
  /\.(from|update|insert|delete)\((organizations|users|orgMemberships)\)|(inner|left)Join\((organizations|users|orgMemberships)\b/;

function violations(file: string, source: string): string[] {
  const lines = source.split("\n");
  const found: string[] = [];
  lines.forEach((line, i) => {
    if (!FORBIDDEN.test(line)) return;
    // Walk back to the start of this query chain: `database` means the
    // restricted-role callback, a bare `db` means the plain client.
    for (let j = i; j >= Math.max(0, i - 12); j--) {
      if (/\bdatabase\b/.test(lines[j])) {
        found.push(`${file}:${i + 1}  ${line.trim()}`);
        return;
      }
      if (/\bdb!?\s*(\.|$)|=\s*db!?\s*$/.test(lines[j])) return;
    }
  });
  return found;
}

describe("restricted-role table access", () => {
  it("never queries organizations/users/org_memberships through withOrgQuery", () => {
    const root = process.cwd();
    const files = ["lib/actions", "lib/jobs", "lib/commercial", "lib/activity"].flatMap(
      (dir) =>
        readdirSync(join(root, dir))
          .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
          .map((f) => `${dir}/${f}`)
    );
    const all = files.flatMap((f) =>
      violations(f, readFileSync(join(root, f), "utf8"))
    );
    assert.deepEqual(
      all,
      [],
      "Use lib/org/organization.ts or the plain db client for these tables:\n" +
        all.join("\n")
    );
  });

  it("detects the pattern (sanity check of the guard itself)", () => {
    const bad = [
      "const rows = await withOrgQuery(orgId, (database) =>",
      "  database",
      "    .select()",
      "    .from(organizations)",
      ");",
    ].join("\n");
    assert.equal(violations("x.ts", bad).length, 1);
    const ok = ["const rows = await db", "  .select()", "  .from(organizations)"].join("\n");
    assert.equal(violations("y.ts", ok).length, 0);
  });
});
