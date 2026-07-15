import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { presignDownload } from "@/lib/r2";
import { TEMPLATE_LIST } from "@/lib/studio-templates";

// İmzalı R2 URL'leri üretilir — public bucket URL'i bağlı olmasa da oynar.
export const dynamic = "force-dynamic";

export default async function StudioShowcasePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Her şablonun örnek klibi studio/showcase/{key}.mp4 — imzalı URL (6 saat)
  const items = await Promise.all(
    TEMPLATE_LIST.map(async (t) => ({
      template: t,
      url: await presignDownload(`studio/showcase/${t.key}.mp4`, 6 * 3600),
    })),
  );

  return (
    <div className="app-page space-y-5">
      <div className="dash-in">
        <p className="app-page-meta">AI Stüdyo</p>
        <h1 className="app-page-title">Şablon Vitrini</h1>
        <p className="app-page-desc">
          Her hazır şablonun örnek çıktısı. Emlakçıya hangi tarzın uygun
          olduğunu göstermek için kullanın — efektler (FPV uçuş, hız rampası,
          motion blur, film tonu, golden hour) AI ile üretilir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ template: t, url }) => {
          const portrait = t.aspectRatio === "9:16";
          return (
            <div
              key={t.key}
              className="dash-card dash-in flex flex-col overflow-hidden p-0"
            >
              <div className="flex items-center justify-center bg-black">
                <video
                  src={url}
                  controls
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className={
                    portrait
                      ? "max-h-[420px] w-auto"
                      : "aspect-video w-full object-cover"
                  }
                />
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{t.label}</h3>
                  <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10px] font-bold text-ink/50">
                    {t.aspectRatio === "9:16" ? "9:16 Dikey" : "16:9"}
                  </span>
                  {t.badge && (
                    <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      {t.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-ink/50">{t.subtitle}</p>
                <p className="text-xs leading-relaxed text-ink/45">
                  {t.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="dash-in text-xs text-ink/40">
        Not: Bu klipler tek sahnelik örneklerdir (5 sn). Gerçek videolar birden
        çok sahne + seslendirme + altyazı + geçiş + müzik içerir.
      </p>
    </div>
  );
}
