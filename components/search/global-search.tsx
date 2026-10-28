"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import {
  globalSearch,
  type SearchResultGroup,
} from "@/lib/actions/global-search";
import { cn } from "@/lib/utils";

type Props = {
  session: Session;
  staffTags: string[];
};

export function GlobalSearch({ session }: Props) {
  const orgId = session.user.orgId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const flat = groups.flatMap((g) => g.items);

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
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    setQuery("");
    setGroups([]);
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setGroups([]);
      return;
    }
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const next = await globalSearch(orgId, query);
        setGroups(next);
        setActiveIndex(0);
      });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [query, orgId]);

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

  let itemOffset = 0;

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
          className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--foreground)]/40 p-4 pt-[12vh]"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl"
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
              className="w-full border-b border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm outline-none"
            />
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-2 py-4 text-sm text-[var(--muted)]">
                  Type at least 2 characters.
                </p>
              ) : pending ? (
                <p className="px-2 py-4 text-sm text-[var(--muted)]">Searching…</p>
              ) : groups.length === 0 ? (
                <p className="px-2 py-4 text-sm text-[var(--muted)]">
                  No results.
                </p>
              ) : (
                groups.map((group) => {
                  const start = itemOffset;
                  itemOffset += group.items.length;
                  return (
                    <div key={group.label} className="mb-2">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                        {group.label}
                      </p>
                      <ul>
                        {group.items.map((item, idx) => {
                          const flatIdx = start + idx;
                          const active = flatIdx === activeIndex;
                          return (
                            <li key={item.id + item.href}>
                              <Link
                                href={item.href}
                                className={cn(
                                  "block rounded-md px-3 py-2 text-left",
                                  active && "bg-[var(--surface-hover)]"
                                )}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                onClick={() => setOpen(false)}
                              >
                                <span className="block text-sm font-medium text-[var(--foreground)]">
                                  {item.title}
                                </span>
                                <span className="block text-xs text-[var(--muted)]">
                                  {item.subtitle}
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
          </div>
        </div>
      ) : null}
    </>
  );
}
