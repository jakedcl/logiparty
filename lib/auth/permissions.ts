import type { OrgMembership } from "@/lib/db/schema";

export type SessionMembership = Pick<
  OrgMembership,
  "isOrgAdmin" | "isManager" | "isStaff" | "isClient"
>;

export function isOrgAdmin(m: SessionMembership): boolean {
  return m.isOrgAdmin;
}

export function isManager(m: SessionMembership): boolean {
  return m.isOrgAdmin || m.isManager;
}

export function isStaffMember(m: SessionMembership): boolean {
  return m.isStaff;
}

export function isClientUser(m: SessionMembership): boolean {
  return m.isClient;
}

export function canManageOrgSettings(m: SessionMembership): boolean {
  return m.isOrgAdmin;
}

/** OrgAdmin or Manager — open Billing in settings (soft Stripe scaffold). */
export function canManageBilling(m: SessionMembership): boolean {
  return m.isOrgAdmin || m.isManager;
}

export function canManageJobs(m: SessionMembership): boolean {
  return m.isOrgAdmin || m.isManager;
}

/** Staff (and dual manager+staff) — see assigned jobs only */
export function canViewMyJobs(m: SessionMembership): boolean {
  return m.isStaff;
}

export function canAccessInternalDashboard(m: SessionMembership): boolean {
  return m.isOrgAdmin || m.isManager || m.isStaff;
}

export function canAccessClientPortal(m: SessionMembership): boolean {
  return m.isClient;
}

export function canInviteUsers(m: SessionMembership): boolean {
  return m.isOrgAdmin || m.isManager;
}

/** Managers (incl. OrgAdmin) + staff with warehouse tag */
export function canManageOrgInventory(
  m: SessionMembership,
  staffTags: readonly string[] = []
): boolean {
  if (m.isOrgAdmin || m.isManager) return true;
  return m.isStaff && staffTags.includes("warehouse");
}

/** Same people as org inventory: managers + warehouse staff */
export function canManageClientInventory(
  m: SessionMembership,
  staffTags: readonly string[] = []
): boolean {
  return canManageOrgInventory(m, staffTags);
}

/** Managers only — warehouse staff cannot CRUD fleet (APP_CONTEXT matrix) */
export function canManageFleet(m: SessionMembership): boolean {
  return m.isOrgAdmin || m.isManager;
}

/** Managers or warehouse staff — update quantity_loaded on job lines */
export function canUpdateQuantityLoaded(
  m: SessionMembership,
  staffTags: readonly string[] = []
): boolean {
  return canManageOrgInventory(m, staffTags);
}

/** Managers or clients — upload job documents (staff cannot). */
export function canUploadDocuments(m: SessionMembership): boolean {
  return canManageJobs(m) || m.isClient;
}

/** Managers delete any job doc; clients delete own uploads only (enforced in action). */
export function canDeleteDocuments(m: SessionMembership): boolean {
  return canManageJobs(m) || m.isClient;
}

/** Staff submit time-off requests */
export function canSubmitAvailability(m: SessionMembership): boolean {
  return m.isStaff;
}

/** Managers approve or deny availability */
export function canReviewAvailability(m: SessionMembership): boolean {
  return m.isOrgAdmin || m.isManager;
}
