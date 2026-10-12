"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { sessionRoleLabel } from "@/lib/dev/role-switch";

type Props = {
  name?: string | null;
  email?: string | null;
  isOrgAdmin?: boolean;
  isManager?: boolean;
  isStaff?: boolean;
  isClient?: boolean;
  staffTags?: readonly string[];
  profileHref: string;
  signOutAction: () => Promise<void>;
};

function initials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email || "").replace(/@.*/, "");
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return (source.slice(0, 2) || "•").toUpperCase();
}

/** Name + role chip → glossy menu with My Profile and Sign out. */
export function SessionIdentity({
  name,
  email,
  staffTags = [],
  profileHref,
  signOutAction,
  ...flags
}: Props) {
  const label = name?.trim() || email || "Signed in";
  const role = sessionRoleLabel(flags, staffTags);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="lp-identity text-right leading-tight focus-visible:outline-none"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lp-avatar" aria-hidden>
          {initials(name, email)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold max-w-[10rem] sm:max-w-[14rem]">
            {label}
          </span>
          <span className="block text-xs text-[var(--muted)]">{role}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--subtle)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="lp-popover absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] py-1"
        >
          <Link
            href={profileHref}
            role="menuitem"
            className="lp-menu-item"
            onClick={() => setOpen(false)}
          >
            My Profile
          </Link>
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className="lp-menu-item">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
