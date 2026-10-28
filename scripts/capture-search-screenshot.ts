/**
 * Capture search modal screenshot with Playwright (dev only).
 * npx playwright install chromium && npx tsx scripts/capture-search-screenshot.ts
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

async function main() {
  loadEnvLocal();
  const BASE = "http://nydac.localhost:3000";
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const csrfRes = await context.request.get(`${BASE}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  await context.request.post(`${BASE}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email: "mike@test.test",
      password: "password123",
      orgSlug: "nydac",
      redirect: "false",
      callbackUrl: `${BASE}/dashboard`,
    },
  });

  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  if (page.url().includes("/login")) {
    throw new Error("Login failed — still on login page");
  }
  await page.getByRole("button", { name: /Open search/i }).click();
  const dialog = page.getByRole("dialog", { name: "Search" });
  const input = dialog.getByPlaceholder("Search jobs, clients, inventory…");
  await input.waitFor({ timeout: 15000 });
  await input.fill("Red Bull");
  await dialog.getByText("Jobs", { exact: true }).waitFor({ timeout: 10000 });
  await page.screenshot({
    path: "docs/internal/screenshots/search.png",
  });
  await browser.close();
  console.log("saved docs/internal/screenshots/search.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
