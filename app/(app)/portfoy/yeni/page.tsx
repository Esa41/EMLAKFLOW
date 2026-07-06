import Link from "next/link";
import { Lock } from "lucide-react";
import { ListingForm } from "@/components/listing-form";
import { getSession } from "@/lib/auth";
import { getListingUsage, FREE_LISTING_LIMIT } from "@/lib/plans";

export default async function NewListingPage() {
  const session = (await getSession())!;
  const usage = await getListingUsage(session.tenantId);

  if (!usage.canCreate) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-[27px] font-extrabold tracking-tight">
            Yeni İlan
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            Kaydettiğinde açık taleplerle otomatik eşleştirilir.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lock size={22} />
          </div>
          <h2 className="font-display text-lg font-extrabold text-ink">
            İlan limitine ulaştın
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
            Ücretsiz planda en fazla {FREE_LISTING_LIMIT} ilan ekleyebilirsin
            (şu an {usage.count}/{FREE_LISTING_LIMIT}). Sınırsız ilan ve tüm
            özellikler için Pro&apos;ya geçmen gerekiyor.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/portfoy"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink/70 ring-1 ring-ink/15 hover:bg-ink/[0.04]"
            >
              Portföye dön
            </Link>
            <Link
              href="/ayarlar"
              className="btn-selvi rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            >
              Pro&apos;ya geç
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">
          Yeni İlan
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Kaydettiğinde açık taleplerle otomatik eşleştirilir.
          {!usage.isPro && (
            <span className="ml-1 text-ink/45">
              ({usage.count}/{FREE_LISTING_LIMIT} ilan kullanıldı)
            </span>
          )}
        </p>
      </div>
      <ListingForm />
    </div>
  );
}
