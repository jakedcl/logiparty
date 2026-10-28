"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Package,
  Search,
  Truck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SearchResultGroup } from "@/lib/actions/global-search";
import { cn } from "@/lib/utils";

const GROUP_ICONS: Record<string, LucideIcon> = {
  Jobs: Briefcase,
  "My jobs": Briefcase,
  "Your jobs": Briefcase,
  Clients: Users,
  Inventory: Package,
  Equipment: Package,
  Crew: UserRound,
  Fleet: Truck,
  Vehicles: Truck,
};

function groupIcon(label: string): LucideIcon {
  return GROUP_ICONS[label] ?? Search;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-[color-mix(in_srgb,var(--primary)_22%,white)] px-0.5 font-semibold text-[var(--foreground)]">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function Kbd({
  children,
  variant = "panel",
}: {
  children: React.ReactNode;
  variant?: "chrome" | "panel";
}) {
  if (variant === "chrome") {
    return (
      <kbd className="shrink-0 rounded border border-[color-mix(in_srgb,var(--primary-foreground)_45%,transparent)] bg-[color-mix(in_srgb,var(--primary-foreground)_18%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--primary-foreground)] shadow-none">
        {children}
      </kbd>
    );
  }
  return (
    <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)] shadow-sm">
      {children}
    </kbd>
  );
}

type Props = {
  fetchResults: (query: string) => Promise<SearchResultGroup[]>;
  triggerPlaceholder?: string;
  inputPlaceholder?: string;
  compactTrigger?: boolean;
};

export function CommandPaletteSearch({
  fetchResults,
  triggerPlaceholder = "Search jobs, clients, inventory…",
  inputPlaceholder = "Search jobs, clients, inventory…",
  compactTrigger = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

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
      fetchResults(trimmed)
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
  }, [query, fetchResults]);

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
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
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

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const modKey =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform)
      ? "⌘"
      : "Ctrl";

  return (
    <>
      <button
        type="button"
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[color-mix(in_srgb,var(--primary-foreground)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary-foreground)_12%,transparent)] px-3 py-1.5 text-left text-sm text-[color-mix(in_srgb,var(--primary-foreground)_88%,transparent)] transition hover:border-[color-mix(in_srgb,var(--primary-foreground)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary-foreground)_18%,transparent)]",
          compactTrigger ? "max-w-[140px] justify-center sm:max-w-none" : "max-w-md lg:w-80",
          !compactTrigger && "hidden sm:flex"
        )}
        onClick={() => setOpen(true)}
        aria-label="Open search"
      >
        <Search
          className="h-4 w-4 shrink-0 opacity-80"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate opacity-90">
          {triggerPlaceholder}
        </span>
        <Kbd variant="chrome">{modKey}K</Kbd>
      </button>
      {compactTrigger ? null : (
        <button
          type="button"
          className="rounded-md border border-[color-mix(in_srgb,var(--primary-foreground)_35%,transparent)] px-2 py-1 text-xs font-medium text-[var(--primary-foreground)] sm:hidden"
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          Search
        </button>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[10vh]"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="lp-command-palette flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[var(--lp-line)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5">
              <Search
                className="h-4 w-4 shrink-0 text-[var(--muted)]"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={inputPlaceholder}
                className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                autoComplete="off"
                spellCheck={false}
              />
              <Kbd>esc</Kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[min(50vh,420px)] overflow-y-auto py-2"
            >
              {query.trim().length < 2 ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  Type at least 2 characters to search jobs, clients, inventory,
                  crew, and vehicles.
                </p>
              ) : loading ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  Searching…
                </p>
              ) : error ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--danger)]">
                  {error}
                </p>
              ) : groups.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No results for &ldquo;{query.trim()}&rdquo;.
                </p>
              ) : (
                groups.map((group) => {
                  const Icon = groupIcon(group.label);
                  return (
                    <div key={group.label} className="mb-1 px-2">
                      <p className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
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
                                data-active={active ? "true" : undefined}
                                className={cn(
                                  "flex items-start gap-3 rounded-lg px-2 py-2 text-left transition",
                                  active
                                    ? "bg-[color-mix(in_srgb,var(--primary)_12%,white)] ring-1 ring-[color-mix(in_srgb,var(--primary)_28%,transparent)]"
                                    : "hover:bg-[var(--surface-hover)]"
                                )}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                onClick={() => setOpen(false)}
                              >
                                <span
                                  className={cn(
                                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--muted)]",
                                    active && "border-[color-mix(in_srgb,var(--primary)_35%,transparent)] text-[var(--primary)]"
                                  )}
                                >
                                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                                    <HighlightedText
                                      text={item.title}
                                      query={query}
                                    />
                                  </span>
                                  <span className="block truncate text-xs text-[var(--muted)]">
                                    {item.subtitle}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--border-subtle)] bg-[var(--surface-hover)] px-4 py-2 text-[11px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>↵</Kbd>
                open
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>esc</Kbd>
                close
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
