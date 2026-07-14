import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// AI iyileştirme (Fal.ai çağrısı + R2 kopyalama) varsayılan süre sınırını
// aşabilir — bu sayfadan tetiklenen server action'lar için süreyi uzat.
export const maxDuration = 60;
import { getStudioCredits, getStudioListings, getStudioHistory } from "@/app/actions/studio";
import { StudioWorkspace } from "@/components/studio-workspace";
import { isPro } from "@/lib/plans";

export default async function StudioPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [credits, listings, history] = await Promise.all([
    getStudioCredits(),
    getStudioListings(),
    getStudioHistory(),
  ]);

  if (!credits) redirect("/login");

  // Pro veya Premium kontrolü
  if (!isPro(credits.plan)) {
    return (
      <div className="app-page space-y-4">
        <div className="dash-in">
          <p className="app-page-meta">AI Stüdyo</p>
          <h1 className="app-page-title">AI Stüdyo</h1>
          <p className="app-page-desc">
            Fotoğraf iyileştirme ve video üretim özelliklerini kullanmak için Pro
            veya Premium plana geçmeniz gerekmektedir.
          </p>
        </div>
        <div className="dash-card dash-in p-8 text-center" style={{ animationDelay: "100ms" }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500/10 to-violet-500/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
              <path d="M12 3l1.5 4.5h4.5l-3.5 3 1.5 4.5L12 12l-4 3 1.5-4.5-3.5-3h4.5z" />
            </svg>
          </div>
          <h2 className="mt-4 font-display text-lg font-bold">Pro Plan Gerekli</h2>
          <p className="mt-2 text-sm text-ink/55">
            AI Stüdyo, Pro ve Premium planlarda her ay yenilenen krediyle kullanılabilir.
          </p>
          <a
            href="/ayarlar"
            className="dash-btn-primary mt-6 inline-flex"
          >
            Planınızı yükseltin
          </a>
        </div>
      </div>
    );
  }

  return (
    <StudioWorkspace
      listings={listings}
      credits={credits}
      history={history}
    />
  );
}
