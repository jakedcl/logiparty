import { redirect } from "next/navigation";

/** Bookmarks: Activity log moved under Settings */
export default function ActivityRedirectPage() {
  redirect("/dashboard/settings/activity");
}
