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
  | "manager2"
  | "warehouse"
  | "driver"
  | "client";

export type DevPersonaMeta = {
  id: DevPersonaId;
  /** Button label in the Dev panel — "Name — Role" */
  buttonLabel: string;
  /** Short role for legend / secondary line */
  roleLabel: string;
  email: string;
  redirectPath: "/dashboard" | "/portal";
};

/** Public persona list (emails are not secrets; passwords stay server-side). */
export const DEV_PERSONAS: readonly DevPersonaMeta[] = [
  {
    id: "orgAdmin",
    buttonLabel: "Ed — OrgAdmin",
    roleLabel: "OrgAdmin",
    email: "ed@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "manager",
    buttonLabel: "Mike Oso — Manager",
    roleLabel: "Manager",
    email: "mike@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "manager2",
    buttonLabel: "Don — Manager",
    roleLabel: "Manager",
    email: "don@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "warehouse",
    buttonLabel: "Tom — Warehouse",
    roleLabel: "Staff (Warehouse)",
    email: "tom@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "driver",
    buttonLabel: "Paul — Driver",
    roleLabel: "Staff (Driver)",
    email: "paul@test.test",
    redirectPath: "/dashboard",
  },
  {
    id: "client",
    buttonLabel: "Michaela — Client",
    roleLabel: "Client (Red Bull)",
    email: "michaela@redbull.test",
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
