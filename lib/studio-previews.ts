import "server-only";
import { listKeys, presignDownload } from "@/lib/r2";
import { TEMPLATE_LIST } from "@/lib/studio-templates";

/**
 * Şablon önizleme klipleri studio/templates/{key}.mp4 altında durur.
 * R2 public URL'i bağlı olmadığından imzalı (presigned) URL üretilir.
 * Yalnızca gerçekten var olan dosyalar döner — eksik olan şablon
 * kartında "örnek yakında" gösterilir.
 */
export async function getTemplatePreviewUrls(): Promise<Record<string, string>> {
  const existing = new Set(await listKeys("studio/templates/"));
  const out: Record<string, string> = {};
  await Promise.all(
    TEMPLATE_LIST.map(async (t) => {
      const key = `studio/templates/${t.key}.mp4`;
      if (existing.has(key)) out[t.key] = await presignDownload(key, 6 * 3600);
    }),
  );
  return out;
}
