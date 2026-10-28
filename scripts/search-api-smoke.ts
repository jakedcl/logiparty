#!/usr/bin/env npx tsx
/** Quick authenticated /api/search check. */
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 1) continue;
  if (!process.env[t.slice(0, eq).trim()])
    process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

async function login(email: string) {
  const BASE = "http://nydac.localhost:3000";
  const jar = new Map<string, string>();
  const h = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const absorb = (res: Response) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const part = c.split(";")[0];
      const eq = part.indexOf("=");
      if (eq < 1) continue;
      jar.set(part.slice(0, eq), part.slice(eq + 1));
    }
  };
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, {
    headers: { cookie: h() },
  });
  absorb(csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: h(),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password: "password123",
      orgSlug: "nydac",
      redirect: "false",
      callbackUrl: `${BASE}/dashboard`,
    }),
  });
  absorb(loginRes);
  return h;
}

async function main() {
  const cookieHeader = await login("mike@test.test");
  const res = await fetch(
    "http://nydac.localhost:3000/api/search?q=" +
      encodeURIComponent("Red Bull"),
    { headers: { cookie: cookieHeader() } }
  );
  console.log("status", res.status);
  console.log(await res.text());
}

main();
