import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 — S3 uyumlu istemci.
 * Yükleme akışı (PERDE'deki desenle aynı):
 *   1. İstemci /api/uploads'a dosya adı + tip gönderir
 *   2. Sunucu 5 dk geçerli presigned PUT URL döner
 *   3. İstemci dosyayı DOĞRUDAN R2'ye PUT eder (sunucudan geçmez)
 *   4. İstemci medyayı /api/listings/[id]/media ile kaydeder
 */
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET ?? "emlakflow-media";

export function publicUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function presignUpload(key: string, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, cmd, { expiresIn: 300 });
}

export async function deleteObject(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
