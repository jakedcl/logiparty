import { headers } from "next/headers";
import { switchDevPersona } from "@/lib/actions/dev-role-switch";
import {
  getDevPersonaHint,
  getDevPersonasForOrg,
  isDevRoleSwitchAllowed,
} from "@/lib/dev/role-switch";
import { getOrgSlugFromHeaders } from "@/lib/org/subdomain";

type Props = {
  /**
   * Optional override. Prefer host slug (current tenant) — panel resolves
   * from middleware headers when omitted so personas match the subdomain.
   */
  orgSlug?: string | null;
};

/** Floating Dev panel — only renders when ALLOW_DEV_ROLE_SWITCH is on (never Production). */
export async function DevRoleSwitchPanel({ orgSlug: orgSlugProp }: Props) {
  if (!isDevRoleSwitchAllowed()) return null;

  const headersList = await headers();
  const orgSlug = orgSlugProp ?? getOrgSlugFromHeaders(headersList);
  const personas = getDevPersonasForOrg(orgSlug);
  if (personas.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 no-print">
      <details className="group w-44 rounded-lg border border-neutral-300 bg-white shadow-md open:w-52">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 hover:bg-neutral-50 rounded-lg [&::-webkit-details-marker]:hidden">
          Dev
          <span className="ml-1 font-normal text-neutral-400 group-open:hidden">
            ▸
          </span>
          <span className="ml-1 font-normal text-neutral-400 hidden group-open:inline">
            ▾
          </span>
        </summary>
        <div className="border-t border-neutral-100 px-2 py-2 space-y-1">
          <p className="px-1 pb-1 text-[10px] leading-snug text-neutral-400">
            {getDevPersonaHint(orgSlug)}
          </p>
          {personas.map((p) => (
            <form key={p.id} action={switchDevPersona}>
              <input type="hidden" name="persona" value={p.id} />
              <button
                type="submit"
                className="w-full rounded px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                title={`${p.email} → ${p.redirectPath}`}
              >
                {p.buttonLabel}
              </button>
            </form>
          ))}
        </div>
      </details>
    </div>
  );
}
