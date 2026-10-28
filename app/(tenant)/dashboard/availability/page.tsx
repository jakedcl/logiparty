import { redirect } from "next/navigation";

/** Bookmarks: Availability moved under Settings → Time off */
export default function AvailabilityRedirectPage() {
  redirect("/dashboard/settings/time-off");
}
