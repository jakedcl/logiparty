import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 20 * 1024 * 1024;

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "File storage is not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME."
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function client() {
  const { accountId, accessKeyId, secretAccessKey } = r2Config();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function assertAllowedUpload(file: File) {
  if (!file || file.size === 0) throw new Error("Choose a file to upload");
  if (file.size > MAX_BYTES) throw new Error("File must be 20 MB or smaller");
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Only PDF and image files are allowed");
  }
}

export async function putJobObject(args: {
  orgId: string;
  jobId: string;
  documentId: string;
  file: File;
}): Promise<{ storageKey: string; mimeType: string; size: number }> {
  const { bucket } = r2Config();
  const safeName = args.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const storageKey = `${args.orgId}/jobs/${args.jobId}/${args.documentId}-${safeName}`;
  const body = Buffer.from(await args.file.arrayBuffer());

  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: body,
      ContentType: args.file.type || "application/octet-stream",
      ContentLength: body.length,
    })
  );

  return {
    storageKey,
    mimeType: args.file.type,
    size: body.length,
  };
}

export async function getObjectDownloadUrl(storageKey: string): Promise<string> {
  const { bucket } = r2Config();
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
    { expiresIn: 60 * 10 }
  );
}
