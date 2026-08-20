"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/portal", label: "Home" },
  { href: "/portal/jobs", label: "Jobs" },
  { href: "/portal/inventory", label: "Inventory" },
  { href: "/portal/notes", label: "Notes" },
] as const;

export function PortalNav({
  className,
  itemClassName,
  underline = false,
}: {
  className?: string;
  itemClassName?: string;
  /** Desktop top nav uses brand underline for active */
  underline?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className={className} aria-label="Portal">
      {NAV.map((item) => {
        const active =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              itemClassName,
              active
                ? "font-semibold text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
            style={
              underline && active
                ? { boxShadow: "inset 0 -2px 0 var(--primary)" }
                : undefined
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
