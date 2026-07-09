import Link from "next/link";
import Image from "next/image";
import { Plus, Building2, Lock, Star } from "lucide-react";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { trMoney } from "@/lib/labels";
import { getListingUsage, FREE_LISTING_LIMIT } from "@/lib/plans";

const KUNYE_CLS: Record<string, string> = {
  ACTIVE: "",
  SOLD: "kunye-satildi",
  RENTED: "kunye-satildi",
  PASSIVE: "kunye-pasif",
  DRAFT: "kunye-pasif",
};
const KUNYE_TXT: Record<string, string> = {
  SOLD: "SATILDI",
  RENTED: "KİRALANDI",
  PASSIVE: "PASİF",
  DRAFT: "TASLAK",
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; purpose?: string; featured?: string }>;
}) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const sp = await searchParams;
  const usage = await getListingUsage(session.tenantId);

  const listings = await db.listing.findMany({
    where: {
      ...(sp.status ? { status: sp.status as never } : {}),
      ...(sp.purpose ? { purpose: sp.purpose as never } : {}),
      ...(sp.featured === "1" ? { featured: true } : {}),
      ...(sp.q
        ? {
            OR: [
              { title: { contains: sp.q, mode: "insensitive" } },
              { refCode: { contains: sp.q, mode: "insensitive" } },
              { neighborhood: { contains: sp.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      media: { orderBy: { order: "asc" }, take: 1 },
      agent: { select: { name: true } },
    },
  });

  const filters = [
    { href: "/portfoy", label: "Tümü", active: !sp.status && !sp.purpose && sp.featured !== "1" },
    { href: "/portfoy?featured=1", label: "Öne çıkanlar", active: sp.featured === "1" },
    { href: "/portfoy?purpose=SALE", label: "Satılık", active: sp.purpose === "SALE" },
    { href: "/portfoy?purpose=RENT", label: "Kiralık", active: sp.purpose === "RENT" },
    { href: "/portfoy?status=SOLD", label: "Satılan", active: sp.status === "SOLD" },
    { href: "/portfoy?status=PASSIVE", label: "Pasif", active: sp.status === "PASSIVE" },
  ];

  return (
    <div className="app-page dash-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="app-page-meta">
            {listings.length} kayıt
            {!usage.isPro && (
              <span className="text-ink/35">
                {" "}
                · {usage.count}/{FREE_LISTING_LIMIT} ilan
              </span>
            )}
          </p>
          <h1 className="app-page-title">Portföy</h1>
        </div>
        {usage.canCreate ? (
          <Link href="/portfoy/yeni" className="dash-btn-primary">
            <Plus size={15} /> Yeni ilan
          </Link>
        ) : (
          <Link
            href="/ayarlar"
            title={`Ücretsiz planda en fazla ${FREE_LISTING_LIMIT} ilan. Pro'ya geç.`}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-2 text-[13px] font-semibold text-amber-800 transition hover:bg-amber-500/15"
          >
            <Lock size={14} /> Limit doldu · Pro&apos;ya geç
          </Link>
        )}
      </div>

      {!usage.canCreate && (
        <div className="dash-alert-warn">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <p>
            Ücretsiz planın {FREE_LISTING_LIMIT} ilan limitine ulaştın. Yeni ilan eklemek için
            mevcut bir ilanı sil ya da{" "}
            <Link href="/ayarlar" className="font-semibold underline">
              Pro&apos;ya geç
            </Link>
            .
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={`dash-filter-pill ${f.active ? "dash-filter-pill-active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="dash-empty py-16">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-ink/15" strokeWidth={1.5} />
          <p>
            Bu filtreyle eşleşen ilan yok.{" "}
            <Link href="/portfoy/yeni" className="font-semibold text-brand-600 hover:underline">
              İlk ilanını ekle
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => {
            const plaka =
              l.status === "ACTIVE"
                ? l.title
                : `${l.title} — ${KUNYE_TXT[l.status] ?? l.status}`;
            return (
              <Link key={l.id} href={`/portfoy/${l.id}`} className="dash-listing-card group">
                <div className="relative">
                  <div className="relative h-40 overflow-hidden rounded-t-[18px] bg-ink/[0.03]">
                    {l.media[0] ? (
                      <Image
                        src={l.media[0].cardUrl ?? l.media[0].url}
                        alt={l.title}
                        fill
                        loading="lazy"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink/15">
                        <Building2 size={28} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <span
                    className={`kunye absolute bottom-3 left-3 max-w-[85%] truncate shadow-sm ${KUNYE_CLS[l.status] ?? ""}`}
                  >
                    {plaka}
                  </span>
                  {l.featured && l.status === "ACTIVE" && (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/80">
                      <Star size={14} fill="currentColor" />
                    </span>
                  )}
                </div>
                <div className="px-4 pb-4 pt-3">
                  <h3 className="line-clamp-1 text-[14px] font-semibold">{l.title}</h3>
                  <p className="mt-1 font-display text-[17px] font-bold tracking-tight tabular-nums">
                    {trMoney.format(Number(l.price))}
                    {l.purpose === "RENT" && (
                      <span className="text-[13px] font-medium text-ink/40"> /ay</span>
                    )}
                  </p>
                  <p className="mt-1 text-[12px] text-ink/45">
                    {l.rooms ?? l.grossArea + " m²"} · net {l.netArea ?? "—"} m²
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-ink/35">
                    {l.agent?.name ?? "—"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
