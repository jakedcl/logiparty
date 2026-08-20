import { CollapsibleAdd } from "@/components/jobs/collapsible-add";
import { QuietRemove } from "@/components/jobs/quiet-remove";
import {
  deleteJobDocument,
  uploadJobDocument,
  type JobDocumentView,
} from "@/lib/actions/documents";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JobDocuments({
  jobId,
  documents: docs,
  canUpload,
  storageConfigured,
  currentUserId,
  canDeleteAny,
}: {
  jobId: string;
  documents: JobDocumentView[];
  canUpload: boolean;
  storageConfigured: boolean;
  currentUserId: string;
  canDeleteAny: boolean;
}) {
  return (
    <div className="space-y-4">
      {docs.length === 0 ? (
        <p className="text-sm text-neutral-500">No documents yet.</p>
      ) : (
        <div className="lp-table-wrap">
          <ul className="divide-y divide-neutral-100">
            {docs.map((doc) => {
              const canDelete =
                canDeleteAny || doc.uploadedBy === currentUserId;
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-900">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {doc.uploaderRole} · {formatSize(doc.fileSizeBytes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.downloadUrl ? (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-2 py-1"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400 px-2">
                        Unavailable
                      </span>
                    )}
                    {canDelete ? (
                      <QuietRemove label="Delete">
                        <form action={deleteJobDocument}>
                          <input type="hidden" name="jobId" value={jobId} />
                          <input type="hidden" name="id" value={doc.id} />
                          <button type="submit">Delete</button>
                        </form>
                      </QuietRemove>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {canUpload && !storageConfigured ? (
        <p className="text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-md px-3 py-3">
          File uploads will work once Cloudflare R2 is connected. Everything else
          on this job still works without it.
        </p>
      ) : null}

      {canUpload && storageConfigured ? (
        <CollapsibleAdd label="Upload document">
          <form action={uploadJobDocument} className="space-y-3">
            <input type="hidden" name="jobId" value={jobId} />
            <label className="block text-sm text-neutral-600">
              PDF or photo
              <input
                type="file"
                name="file"
                required
                accept="application/pdf,image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                capture="environment"
                className="mt-2 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-white file:text-sm file:font-medium"
              />
            </label>
            <button
              type="submit"
              className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
            >
              Upload document
            </button>
          </form>
        </CollapsibleAdd>
      ) : null}
    </div>
  );
}
