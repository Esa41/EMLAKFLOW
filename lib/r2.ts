import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
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
  // Yeni SDK varsayılanı presigned GET'e `x-amz-checksum-mode=ENABLED` ekliyor;
  // bu imzalı param bazı tarayıcı/R2 kombinasyonlarında GET'i bozar. R2 zaten
  // SigV4 imzasını doğruluyor — checksum'ı yalnızca gerektiğinde hesapla.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
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

/**
 * İmzalı GET URL — R2 public URL'i kapalı/bağlanmamış olsa bile nesneyi
 * doğrudan tarayıcıdan indirilebilir/oynatılabilir kılar (süreli).
 */
export async function presignDownload(key: string, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, cmd, { expiresIn });
}

export async function deleteObject(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** R2'deki nesneyi Buffer olarak indirir (sunucu tarafı görsel işleme için). */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

/** Sunucudan R2'ye doğrudan yükleme — üretilen görsel varyantları için. */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Varyantlar içerik-adresli (key değişmeden içerik değişmez) → agresif cache
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}
