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
        <ul className="space-y-2">
          {docs.map((doc) => {
            const canDelete =
              canDeleteAny || doc.uploadedBy === currentUserId;
            return (
              <li
                key={doc.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border rounded-lg px-3 py-3 text-sm bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-base">{doc.fileName}</p>
                  <p className="text-xs text-neutral-500">
                    {doc.uploaderRole} · {formatSize(doc.fileSizeBytes)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {doc.downloadUrl ? (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg border text-sm font-medium"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">Unavailable</span>
                  )}
                  {canDelete ? (
                    <form action={deleteJobDocument}>
                      <input type="hidden" name="jobId" value={jobId} />
                      <input type="hidden" name="id" value={doc.id} />
                      <button
                        type="submit"
                        className="min-h-[44px] px-3 text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canUpload && !storageConfigured ? (
        <p className="text-sm text-neutral-500 border rounded-lg bg-neutral-50 px-3 py-3">
          File uploads will work once Cloudflare R2 is connected. Everything else
          on this job still works without it.
        </p>
      ) : null}

      {canUpload && storageConfigured ? (
        <form
          action={uploadJobDocument}
          className="space-y-3 border-t pt-4 sticky bottom-20 sm:static sm:bottom-auto bg-neutral-50 sm:bg-transparent -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0"
        >
          <input type="hidden" name="jobId" value={jobId} />
          <label className="block text-sm font-medium text-neutral-700">
            Upload PDF or photo
            <input
              type="file"
              name="file"
              required
              accept="application/pdf,image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
              capture="environment"
              className="mt-2 block w-full text-base file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-3 file:text-white file:font-medium file:min-h-[48px]"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg px-4 py-3 text-base font-medium bg-neutral-900 text-white min-h-[48px]"
          >
            Upload document
          </button>
        </form>
      ) : null}
    </div>
  );
}
