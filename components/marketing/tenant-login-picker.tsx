"use client";

import { useState } from "react";
import { buildTenantOrigin } from "@/lib/org/subdomain";
import { Button } from "@/components/ui/button";

export function TenantLoginPicker() {
  const [slug, setSlug] = useState("");

  function goToTenantLogin() {
    const trimmed = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!trimmed) return;
    const origin = buildTenantOrigin(trimmed);
    // Full navigation to tenant origin (not an in-app route).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- tenant subdomain
    window.location.assign(`${origin}/login`);
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        goToTenantLogin();
      }}
    >
      <div>
        <label htmlFor="org-slug" className="app-label mb-1.5 block">
          Organization slug
        </label>
        <div className="flex gap-2">
          <input
            id="org-slug"
            name="org-slug"
            type="text"
            autoComplete="organization"
            placeholder="your-org"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="lp-input min-w-0 flex-1"
          />
          <span className="hidden self-center text-xs text-[var(--muted)] sm:inline">
            .logiparty.com
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Local dev: use{" "}
          <code className="rounded bg-[var(--surface-hover)] px-1">
            your-org.localhost:3000
          </code>
        </p>
      </div>
      <Button type="submit" className="w-full py-2.5">
        Continue to sign in
      </Button>
    </form>
  );
}
