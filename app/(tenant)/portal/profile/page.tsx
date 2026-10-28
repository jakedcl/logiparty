import Link from "next/link";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getOwnProfile } from "@/lib/actions/profile";
import { requireSession } from "@/lib/org/context";

export default async function PortalProfilePage() {
  await requireSession();
  const profile = await getOwnProfile();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-neutral-500 mb-2">
          <Link
            href="/portal"
            className="hover:text-neutral-800 underline-offset-2 hover:underline"
          >
            Home
          </Link>
          <span className="mx-1.5 text-neutral-300">/</span>
          My Profile
        </p>
        <h1 className="text-2xl font-semibold mb-1">My Profile</h1>
        <p className="text-sm text-neutral-500">
          Your name and password for this account.
        </p>
      </div>

      <ProfileEditor profile={profile} />
    </div>
  );
}
