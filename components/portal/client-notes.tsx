import { sendClientNote } from "@/lib/actions/client-notes";
import type { ClientNoteView } from "@/lib/actions/client-notes";

function fmt(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function preview(body: string, max = 80): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

export function PortalNotesList({ notes }: { notes: ClientNoteView[] }) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        No notes yet. Use + Send a note below to message the warehouse team.
      </p>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-md bg-white overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[420px] text-sm text-left">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50">
            <th className="py-2 px-3 font-medium">Subject</th>
            <th className="py-2 px-3 font-medium">Message</th>
            <th className="py-2 px-3 font-medium w-[7rem]">Status</th>
            <th className="py-2 px-3 font-medium w-[9rem] text-right">Sent</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr
              key={note.id}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
            >
              <td className="py-2 px-3 text-neutral-900 font-medium">
                {note.subject?.trim() || (
                  <span className="text-neutral-400 font-normal">—</span>
                )}
              </td>
              <td className="py-2 px-3 text-neutral-700">
                <span className="line-clamp-2">{preview(note.body, 120)}</span>
              </td>
              <td className="py-2 px-3">
                <span
                  className={
                    note.readAt
                      ? "inline-block rounded px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-600"
                      : "inline-block rounded px-1.5 py-0.5 text-xs bg-amber-100 text-amber-900"
                  }
                >
                  {note.readAt ? "Read" : "Sent"}
                </span>
              </td>
              <td className="py-2 px-3 text-right text-xs text-neutral-400 whitespace-nowrap">
                <time dateTime={note.createdAt.toISOString()}>
                  {fmt(note.createdAt)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortalComposeNote() {
  return (
    <details className="group border-t border-neutral-200 pt-4">
      <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="text-neutral-400 group-open:hidden" aria-hidden>
            +
          </span>
          <span
            className="hidden text-neutral-400 group-open:inline"
            aria-hidden
          >
            −
          </span>
          Send a note
        </span>
      </summary>
      <div className="mt-3 max-w-xl space-y-3">
        <p className="text-xs text-neutral-500">
          One-way message to the warehouse team — not tied to a job or
          inventory item. They will see it in their inbox.
        </p>
        <form action={sendClientNote} className="space-y-3">
          <label className="block text-xs text-neutral-500">
            Subject{" "}
            <span className="text-neutral-400 font-normal">(optional)</span>
            <input
              name="subject"
              placeholder="Short subject"
              maxLength={200}
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-neutral-500">
            Message
            <textarea
              name="body"
              required
              rows={4}
              placeholder="What should the team know?"
              maxLength={4000}
              className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
          >
            Send note
          </button>
        </form>
      </div>
    </details>
  );
}
