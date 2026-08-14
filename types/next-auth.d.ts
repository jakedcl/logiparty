import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    orgId: string;
    orgSlug: string;
    orgName: string;
    isOrgAdmin: boolean;
    isManager: boolean;
    isStaff: boolean;
    isClient: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      orgId: string;
      orgSlug: string;
      orgName: string;
      isOrgAdmin: boolean;
      isManager: boolean;
      isStaff: boolean;
      isClient: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    orgId?: string;
    orgSlug?: string;
    orgName?: string;
    isOrgAdmin?: boolean;
    isManager?: boolean;
    isStaff?: boolean;
    isClient?: boolean;
  }
}
