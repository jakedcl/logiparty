"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SearchResultGroup } from "@/lib/actions/global-search";
import { cn } from "@/lib/utils";

async function fetchPortalSearch(q: string): Promise<SearchResultGroup[]> {
  const params = new URLSearchParams({ q, scope: "portal" });
  const res = await fetch(`/api/search?${params.toString()}`, {
    credentials: "same-origin",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { groups: SearchResultGroup[] };
  return data.groups ?? [];
}

export function PortalGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setGroups([]);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      fetchPortalSearch(trimmed)
        .then((next) => {
          if (!cancelled) setGroups(next);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  return (
    <>
      <button
        type="button"
        className="rounded-md border border-[var(--border-subtle)] px-2 py-1 text-xs font-medium text-[var(--muted)]"
        onClick={() => setOpen(true)}
      >
        Search
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[20vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your jobs…"
              className="mb-2 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            />
            {loading ? (
              <p className="px-2 py-2 text-sm text-neutral-500">Searching…</p>
            ) : flat.length === 0 && query.trim().length >= 2 ? (
              <p className="px-2 py-2 text-sm text-neutral-500">No results.</p>
            ) : (
              flat.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-2 hover:bg-neutral-100"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="block text-xs text-neutral-500">
                    {item.subtitle}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
