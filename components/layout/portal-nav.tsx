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
}: {
  className?: string;
  itemClassName?: string;
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
              "rounded-full border border-transparent px-3",
              active
                ? "app-nav-active"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
