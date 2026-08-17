import type { Session } from "next-auth";

/** Where to send a signed-in user after auth. */
export function postAuthPath(user: Session["user"]): "/portal" | "/dashboard" {
  return user.isClient ? "/portal" : "/dashboard";
}
