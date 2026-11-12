/**
 * Capture product UI screenshots for public/marketing/.
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/marketing");
const ART = "/opt/cursor/artifacts";
const TENANT = "http://northline.localhost:3000";
const APEX = "http://localhost:3000";

mkdirSync(OUT, { recursive: true });
mkdirSync(ART, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    "/home/ubuntu/.cache/ms-playwright/chromium-1148/chrome-linux/chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function signIn(page, email) {
  await page.goto(`${TENANT}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|portal)/, { timeout: 30000 });
}

async function snap(page, file, path, setup) {
  await page.goto(`${TENANT}${path}`, { waitUntil: "networkidle" });
  if (setup) await setup(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, file), fullPage: false });
  console.log("marketing/", file);
}

const mgr = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
await signIn(mgr, "morgan@northline.test");

await snap(mgr, "jobs-list.png", "/dashboard/jobs");
await snap(mgr, "job-detail.png", "/dashboard/jobs", async (p) => {
  await p.getByRole("link", { name: "Waterfront Festival" }).first().click();
  await p.waitForURL(/\/dashboard\/jobs\//);
});
await snap(mgr, "jobs-calendar.png", "/dashboard/jobs?view=calendar");
await snap(mgr, "inventory.png", "/dashboard/inventory");
await snap(mgr, "reports.png", "/dashboard/reports");
await snap(mgr, "quotes.png", "/dashboard/quotes");
await snap(mgr, "invoices.png", "/dashboard/invoices");
await snap(mgr, "search.png", "/dashboard/jobs", async (p) => {
  await p.keyboard.press("Control+k");
  await p.waitForTimeout(400);
});

const staff = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await signIn(staff, "chris@northline.test");
await snap(staff, "my-jobs.png", "/dashboard/my-jobs");

const client = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await signIn(client, "alex@summit.test");
await snap(client, "portal.png", "/portal/jobs");

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const mobile = await browser.newPage({ ...devices["iPhone 13"] });
for (const [page, name] of [
  [desktop, "landing-desktop-after.png"],
  [mobile, "landing-mobile-after.png"],
]) {
  await page.goto(`${APEX}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(ART, name), fullPage: true });
}
for (const [path, file] of [
  ["/login", "login-after.png"],
  ["/pricing", "pricing-desktop-after.png"],
  ["/demo", "demo-desktop-after.png"],
  ["/privacy", "privacy-desktop-after.png"],
  ["/this-path-should-404", "404-desktop-after.png"],
]) {
  await desktop.goto(`${APEX}${path}`, { waitUntil: "networkidle" });
  await desktop.screenshot({
    path: join(ART, file),
    fullPage: path === "/demo" ? false : true,
  });
}

await browser.close();
console.log("Done.");
