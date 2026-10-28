import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isStorageConfigured } from "@/lib/storage/r2";

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("File storage is not configured");
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

export async function putCommercialPdf(args: {
  orgId: string;
  docType: "quotes" | "invoices";
  docId: string;
  version: number;
  bytes: Uint8Array;
}): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error("File storage is not configured");
  }
  const { bucket } = r2Config();
  const storageKey = `${args.orgId}/commercial/${args.docType}/${args.docId}/v${args.version}.pdf`;
  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: args.bytes,
      ContentType: "application/pdf",
      ContentLength: args.bytes.length,
    })
  );
  return storageKey;
}

export async function getCommercialDownloadUrl(
  storageKey: string
): Promise<string> {
  const { bucket } = r2Config();
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
    { expiresIn: 60 * 10 }
  );
}

export async function deleteCommercialObject(storageKey: string): Promise<void> {
  if (!isStorageConfigured()) return;
  const { bucket } = r2Config();
  await client().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: storageKey })
  );
}

export { isStorageConfigured };
