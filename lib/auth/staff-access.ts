import type { SessionMembership } from "@/lib/auth/permissions";

/** Crew-only staff — not org admin or manager (even if also flagged staff). */
export function isStaffOnlyRole(m: SessionMembership): boolean {
  return m.isStaff && !m.isManager && !m.isOrgAdmin;
}

const STAFF_DASHBOARD_PREFIXES = [
  "/dashboard/my-jobs",
  "/dashboard/notifications",
  "/dashboard/inventory",
  "/dashboard/settings/profile",
  "/dashboard/settings/time-off",
  "/dashboard/help",
] as const;

/** Paths crew-only staff may open on the internal dashboard (proxy + layout guard). */
export function isStaffOnlyDashboardPath(pathname: string): boolean {
  if (pathname === "/dashboard/settings") return true;
  return STAFF_DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function staffOnlyDashboardRedirect(pathname: string): string | null {
  if (isStaffOnlyDashboardPath(pathname)) return null;
  return "/dashboard/my-jobs";
}
