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

/** Name + role button → dropdown with My Profile and Sign out. */
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
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-right leading-tight min-w-0 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0">
          <span className="block text-sm text-neutral-800 truncate max-w-[10rem] sm:max-w-[14rem]">
            {label}
          </span>
          <span className="block text-xs text-neutral-500">{role}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${
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
          className="absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] rounded-md border border-neutral-200 bg-white py-1 shadow-md"
        >
          <Link
            href={profileHref}
            role="menuitem"
            className="block px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
            onClick={() => setOpen(false)}
          >
            My Profile
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
