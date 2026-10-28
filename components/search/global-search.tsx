"use client";

import { useCallback } from "react";
import type { SearchResultGroup } from "@/lib/actions/global-search";
import { CommandPaletteSearch } from "@/components/search/command-palette";

async function fetchSearch(q: string): Promise<SearchResultGroup[]> {
  const params = new URLSearchParams({ q });
  const res = await fetch(`/api/search?${params.toString()}`, {
    credentials: "same-origin",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Search failed (${res.status})`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new Error("Search unavailable — try signing in again.");
  }
  const data = (await res.json()) as { groups: SearchResultGroup[] };
  return data.groups ?? [];
}

export function GlobalSearch() {
  const fetchResults = useCallback((q: string) => fetchSearch(q), []);
  return (
    <CommandPaletteSearch
      fetchResults={fetchResults}
      triggerPlaceholder="Search jobs, clients, inventory…"
      inputPlaceholder="Search jobs, clients, inventory…"
    />
  );
}
