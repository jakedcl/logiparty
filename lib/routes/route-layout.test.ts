import { strict as assert } from "node:assert";
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";

const APP_DIR = join(process.cwd(), "app");

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...pageFiles(full));
    else if (/^page\.(t|j)sx?$/.test(name)) out.push(full);
  }
  return out;
}

/**
 * Staff and portal pages must live under the `(tenant)` route group, where
 * the dashboard/portal layouts (shell, theme, nav) are defined. A page placed
 * in a bare `app/dashboard` or `app/portal` directory silently renders with
 * only the root layout.
 */
test("dashboard and portal pages live under the (tenant) route group", () => {
  const offenders = pageFiles(APP_DIR)
    .map((file) => relative(APP_DIR, file).split(sep))
    .filter(([first]) => first === "dashboard" || first === "portal")
    .map((parts) => parts.join("/"));

  assert.deepEqual(
    offenders,
    [],
    `Move these under app/(tenant)/ so they get the tenant layout: ${offenders.join(", ")}`
  );
});
