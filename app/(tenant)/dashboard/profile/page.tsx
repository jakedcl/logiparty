import { redirect } from "next/navigation";

/** Prefer Settings hub path. */
export default function DashboardProfileRedirect() {
  redirect("/dashboard/settings/profile");
}
