"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchResultGroup } from "@/lib/actions/global-search";
import { cn } from "@/lib/utils";

async function fetchSearch(
  q: string,
  scope?: "portal"
): Promise<SearchResultGroup[]> {
  const params = new URLSearchParams({ q });
  if (scope) params.set("scope", scope);
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const flat = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups]
  );

  const flatIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const g of groups) {
      for (const item of g.items) {
        map.set(`${g.label}:${item.id}:${item.href}`, i);
        i += 1;
      }
    }
    return map;
  }, [groups]);

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
      setActiveIndex(0);
      setError(null);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetchSearch(trimmed)
        .then((next) => {
          if (cancelled) return;
          setGroups(next);
          setActiveIndex(0);
        })
        .catch((e) => {
          if (cancelled) return;
          setGroups([]);
          setError(e instanceof Error ? e.message : "Search failed");
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

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && flat[activeIndex]) {
        e.preventDefault();
        go(flat[activeIndex].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flat, activeIndex, go]);

  return (
    <>
      <button
        type="button"
        className="hidden max-w-md flex-1 items-center justify-between gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1.5 text-left text-sm text-[var(--muted)] hover:border-[var(--border)] sm:flex lg:w-80"
        onClick={() => setOpen(true)}
      >
        <span>Search jobs, clients, inventory…</span>
        <kbd className="hidden rounded border border-[var(--border-subtle)] px-1.5 text-[10px] font-medium text-[var(--muted)] md:inline">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        className="rounded-md border border-[var(--border-subtle)] px-2 py-1 text-xs font-medium text-[var(--muted)] sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        Search
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full border-b border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none"
            />
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-2 py-4 text-sm text-neutral-500">
                  Type at least 2 characters.
                </p>
              ) : loading ? (
                <p className="px-2 py-4 text-sm text-neutral-500">Searching…</p>
              ) : error ? (
                <p className="px-2 py-4 text-sm text-red-600">{error}</p>
              ) : groups.length === 0 ? (
                <p className="px-2 py-4 text-sm text-neutral-500">No results.</p>
              ) : (
                groups.map((group) => (
                  <div key={group.label} className="mb-2">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                      {group.label}
                    </p>
                    <ul>
                      {group.items.map((item) => {
                        const key = `${group.label}:${item.id}:${item.href}`;
                        const flatIdx = flatIndexByKey.get(key) ?? 0;
                        const active = flatIdx === activeIndex;
                        return (
                          <li key={key}>
                            <Link
                              href={item.href}
                              className={cn(
                                "block rounded-md px-3 py-2 text-left",
                                active && "bg-neutral-100"
                              )}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              onClick={() => setOpen(false)}
                            >
                              <span className="block text-sm font-medium text-neutral-900">
                                {item.title}
                              </span>
                              <span className="block text-xs text-neutral-500">
                                {item.subtitle}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
