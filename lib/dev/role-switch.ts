/**
 * A8 — Dev role / persona switcher helpers.
 * Hard-deny on Vercel Production even if ALLOW_DEV_ROLE_SWITCH is set.
 */

export function isDevRoleSwitchAllowed(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.ALLOW_DEV_ROLE_SWITCH === "true";
}

export type DevPersonaId =
  | "orgAdmin"
  | "manager"
  | "warehouse"
  | "driver"
  | "client";

export type DevPersonaMeta = {
  id: DevPersonaId;
  /** Button label in the Dev panel */
  buttonLabel: string;
  email: string;
  redirectPath: "/dashboard" | "/portal";
};

/** Public persona list (emails are not secrets; passwords stay server-side). */
export const DEV_PERSONAS: readonly DevPersonaMeta[] = [
  {
    id: "orgAdmin",
    buttonLabel: "OrgAdmin",
    email: "admin@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "manager",
    buttonLabel: "Morgan",
    email: "morgan@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "warehouse",
    buttonLabel: "Sam",
    email: "sam@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "driver",
    buttonLabel: "Dana",
    email: "dana@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "client",
    buttonLabel: "Client",
    email: "rep1@redbull.test",
    redirectPath: "/portal",
  },
] as const;

export function getDevPersona(id: string): DevPersonaMeta | undefined {
  return DEV_PERSONAS.find((p) => p.id === id);
}

type RoleFlags = {
  isOrgAdmin?: boolean;
  isManager?: boolean;
  isStaff?: boolean;
  isClient?: boolean;
};

/** Short human role label for shell headers. */
export function sessionRoleLabel(
  user: RoleFlags,
  staffTags: readonly string[] = []
): string {
  if (user.isClient) return "Client";
  if (user.isOrgAdmin) return "OrgAdmin";
  if (user.isManager) return "Manager";
  if (user.isStaff) {
    if (staffTags.includes("warehouse")) return "Staff (Warehouse)";
    if (staffTags.includes("driver")) return "Staff (Driver)";
    return "Staff";
  }
  return "User";
}
