/**
 * Retake PR verification screenshots (requires dev server + Playwright chromium).
 * npx playwright install chromium && npx tsx scripts/capture-pr-screenshots.ts
 */
import { chromium } from "playwright";
import { existsSync, readFileSync } from "fs";
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
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const BASE = "http://nydac.localhost:3000";
const OUT = "docs/internal/screenshots";

async function login(
  context: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newContext"]>>,
  email: string
) {
  const csrfRes = await context.request.get(`${BASE}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  await context.request.post(`${BASE}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email,
      password: "password123",
      orgSlug: "nydac",
      redirect: "false",
      callbackUrl: `${BASE}/dashboard`,
    },
  });
}

async function main() {
  loadEnvLocal();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await login(context, "mike@test.test");
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Open search/i }).click();
  const dialog = page.getByRole("dialog", { name: "Search" });
  await dialog
    .getByPlaceholder("Search jobs, clients, inventory…")
    .fill("Red Bull");
  await dialog.getByText("Jobs", { exact: true }).waitFor({ timeout: 10000 });
  await page.screenshot({ path: `${OUT}/search.png` });

  await page.goto(`${BASE}/dashboard/reports`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Jobs by status" }).waitFor();
  await page.screenshot({ path: `${OUT}/reports.png` });

  await page.goto(`${BASE}/this-route-does-not-exist-qa`, {
    waitUntil: "networkidle",
  });
  await page.getByText("Page not found").waitFor();
  await page.screenshot({ path: `${OUT}/tenant-404.png` });

  await browser.close();
  console.log(`saved screenshots under ${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
