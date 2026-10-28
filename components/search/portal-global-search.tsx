"use client";

import { useCallback } from "react";
import type { SearchResultGroup } from "@/lib/actions/global-search";
import { CommandPaletteSearch } from "@/components/search/command-palette";

async function fetchPortalSearch(q: string): Promise<SearchResultGroup[]> {
  const params = new URLSearchParams({ q, scope: "portal" });
  const res = await fetch(`/api/search?${params.toString()}`, {
    credentials: "same-origin",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Search failed (${res.status})`);
  }
  const data = (await res.json()) as { groups: SearchResultGroup[] };
  return data.groups ?? [];
}

export function PortalGlobalSearch() {
  const fetchResults = useCallback((q: string) => fetchPortalSearch(q), []);
  return (
    <CommandPaletteSearch
      fetchResults={fetchResults}
      triggerPlaceholder="Search your jobs…"
      inputPlaceholder="Search your jobs…"
      compactTrigger
    />
  );
}
