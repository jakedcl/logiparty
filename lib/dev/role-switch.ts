/**
 * A8 — Dev role / persona switcher helpers.
 * Hard-deny on Vercel Production even if ALLOW_DEV_ROLE_SWITCH is set.
 *
 * Personas are keyed by org slug (host). On nydac → Jake's cast;
 * on test → Acme playground cast.
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

const NYDAC_PERSONAS: readonly DevPersonaMeta[] = [
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

const TEST_PERSONAS: readonly DevPersonaMeta[] = [
  {
    id: "orgAdmin",
    buttonLabel: "Alex Boss — OrgAdmin",
    roleLabel: "OrgAdmin",
    email: "boss@playground.test",
    redirectPath: "/dashboard",
  },
  {
    id: "manager",
    buttonLabel: "Riley — Manager",
    roleLabel: "Manager",
    email: "riley@playground.test",
    redirectPath: "/dashboard",
  },
  {
    id: "warehouse",
    buttonLabel: "Chris — Warehouse",
    roleLabel: "Staff (Warehouse)",
    email: "chris@playground.test",
    redirectPath: "/dashboard",
  },
  {
    id: "driver",
    buttonLabel: "Jamie — Driver",
    roleLabel: "Staff (Driver)",
    email: "jamie@playground.test",
    redirectPath: "/dashboard",
  },
  {
    id: "client",
    buttonLabel: "Nina — Client",
    roleLabel: "Client (Monster)",
    email: "nina@monster.test",
    redirectPath: "/portal",
  },
] as const;

/** Persona map keyed by organization slug (current host). */
export const DEV_PERSONAS_BY_ORG: Readonly<
  Record<string, readonly DevPersonaMeta[]>
> = {
  nydac: NYDAC_PERSONAS,
  test: TEST_PERSONAS,
};

/** @deprecated Prefer getDevPersonasForOrg — defaults to nydac for older imports. */
export const DEV_PERSONAS: readonly DevPersonaMeta[] = NYDAC_PERSONAS;

export function getDevPersonasForOrg(
  orgSlug: string | null | undefined
): readonly DevPersonaMeta[] {
  if (!orgSlug) return [];
  return DEV_PERSONAS_BY_ORG[orgSlug] ?? [];
}

export function getDevPersona(
  id: string,
  orgSlug?: string | null
): DevPersonaMeta | undefined {
  const list = orgSlug
    ? getDevPersonasForOrg(orgSlug)
    : DEV_PERSONAS;
  return list.find((p) => p.id === id);
}

export function getDevPersonaHint(orgSlug: string | null | undefined): string {
  if (orgSlug === "test") {
    return "Seed quick-login · Client = Nina (Monster)";
  }
  if (orgSlug === "nydac") {
    return "Seed quick-login · Client = Michaela (Red Bull)";
  }
  return "No seed personas for this org";
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
