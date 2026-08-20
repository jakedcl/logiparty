import {
  listPortalClientNotes,
} from "@/lib/actions/client-notes";
import {
  PortalComposeNote,
  PortalNotesList,
} from "@/components/portal/client-notes";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

export default async function PortalNotesPage() {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const notes = company
    ? await listPortalClientNotes(session.user.orgId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notes</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Send a message to {session.user.orgName}
          {company ? ` for ${company.name}` : ""}. Not tied to a specific job
          or inventory item.
        </p>
      </div>

      {!company ? (
        <p className="text-sm text-neutral-500">
          Your account is not linked to a client company yet.
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-800">
            Sent notes
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({notes.length})
            </span>
          </h2>
          <PortalNotesList notes={notes} />
          <PortalComposeNote />
        </section>
      )}
    </div>
  );
}
