import { sessionRoleLabel } from "@/lib/dev/role-switch";

type Props = {
  name?: string | null;
  email?: string | null;
  isOrgAdmin?: boolean;
  isManager?: boolean;
  isStaff?: boolean;
  isClient?: boolean;
  staffTags?: readonly string[];
};

/** Display name (or email) + short role — always shown in shell headers. */
export function SessionIdentity({
  name,
  email,
  staffTags = [],
  ...flags
}: Props) {
  const label = name?.trim() || email || "Signed in";
  const role = sessionRoleLabel(flags, staffTags);

  return (
    <div className="text-right leading-tight min-w-0">
      <p className="text-sm text-neutral-800 truncate max-w-[10rem] sm:max-w-[14rem]">
        {label}
      </p>
      <p className="text-xs text-neutral-500">{role}</p>
    </div>
  );
}
