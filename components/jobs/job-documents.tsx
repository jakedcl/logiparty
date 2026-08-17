import { uploadJobDocument, type JobDocumentView } from "@/lib/actions/documents";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JobDocuments({
  jobId,
  documents: docs,
  canUpload,
}: {
  jobId: string;
  documents: JobDocumentView[];
  canUpload: boolean;
}) {
  return (
    <div className="space-y-3">
      {docs.length === 0 ? (
        <p className="text-sm text-neutral-500">No documents yet.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 border rounded px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{doc.fileName}</p>
                <p className="text-xs text-neutral-500">
                  {doc.uploaderRole} · {formatSize(doc.fileSizeBytes)}
                </p>
              </div>
              {doc.downloadUrl ? (
                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-sm text-neutral-700 underline"
                >
                  Open
                </a>
              ) : (
                <span className="text-xs text-neutral-400">Unavailable</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canUpload ? (
        <form action={uploadJobDocument} className="space-y-2 border-t pt-3">
          <input type="hidden" name="jobId" value={jobId} />
          <label className="block text-sm text-neutral-600">
            PDF or image
            <input
              type="file"
              name="file"
              required
              accept="application/pdf,image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
              className="mt-1 block w-full text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
          >
            Upload
          </button>
        </form>
      ) : null}
    </div>
  );
}
