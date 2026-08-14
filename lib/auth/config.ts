import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgMemberships, organizations, users } from "@/lib/db/schema";

export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        orgSlug: { label: "Organization", type: "text" },
      },
      async authorize(credentials) {
        if (!db) return null;
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const orgSlug = credentials?.orgSlug as string | undefined;
        if (!email || !password || !orgSlug) return null;

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, orgSlug))
          .limit(1);
        if (!org) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const [mem] = await db
          .select()
          .from(orgMemberships)
          .where(
            and(
              eq(orgMemberships.orgId, org.id),
              eq(orgMemberships.userId, user.id)
            )
          )
          .limit(1);
        if (!mem) return null;

        return {
          id: user.id,
          email: user.email,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.email,
          orgId: org.id,
          orgSlug: org.slug,
          orgName: org.name,
          isOrgAdmin: mem.isOrgAdmin,
          isManager: mem.isManager,
          isStaff: mem.isStaff,
          isClient: mem.isClient,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.orgId = user.orgId;
        token.orgSlug = user.orgSlug;
        token.orgName = user.orgName;
        token.isOrgAdmin = user.isOrgAdmin;
        token.isManager = user.isManager;
        token.isStaff = user.isStaff;
        token.isClient = user.isClient;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.orgId = token.orgId as string;
        session.user.orgSlug = token.orgSlug as string;
        session.user.orgName = token.orgName as string;
        session.user.isOrgAdmin = token.isOrgAdmin as boolean;
        session.user.isManager = token.isManager as boolean;
        session.user.isStaff = token.isStaff as boolean;
        session.user.isClient = token.isClient as boolean;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
