import Link from "next/link";
import Image from "next/image";
import { Plus, Building2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { trMoney } from "@/lib/labels";

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
  searchParams: Promise<{ q?: string; status?: string; purpose?: string }>;
}) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const sp = await searchParams;

  const listings = await db.listing.findMany({
    where: {
      ...(sp.status ? { status: sp.status as never } : {}),
      ...(sp.purpose ? { purpose: sp.purpose as never } : {}),
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
    { href: "/portfoy", label: "Tümü", active: !sp.status && !sp.purpose },
    {
      href: "/portfoy?purpose=SALE",
      label: "Satılık",
      active: sp.purpose === "SALE",
    },
    {
      href: "/portfoy?purpose=RENT",
      label: "Kiralık",
      active: sp.purpose === "RENT",
    },
    {
      href: "/portfoy?status=SOLD",
      label: "Satılan",
      active: sp.status === "SOLD",
    },
    {
      href: "/portfoy?status=PASSIVE",
      label: "Pasif",
      active: sp.status === "PASSIVE",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
            {listings.length} kayıt
          </p>
          <h1 className="mt-1 font-display text-[27px] font-extrabold tracking-tight">
            Portföy
          </h1>
        </div>
        <Link
          href="/portfoy/yeni"
          className="btn-selvi flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          <Plus size={16} /> Yeni ilan
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              f.active
                ? "border-ink bg-ink text-white"
                : "border-ink/20 bg-white text-ink/65 hover:border-ink/50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-ink/25 bg-white/50 p-12 text-center">
          <Building2 className="mx-auto mb-3 h-9 w-9 text-ink/20" />
          <p className="text-sm text-ink/55">
            Bu filtreyle eşleşen ilan yok.{" "}
            <Link href="/portfoy/yeni" className="font-semibold text-brand-600">
              İlk ilanını ekle
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => {
            const plaka =
              l.status === "ACTIVE"
                ? l.title
                : `${l.title} — ${KUNYE_TXT[l.status] ?? l.status}`;
            return (
              <Link
                key={l.id}
                href={`/portfoy/${l.id}`}
                className="group overflow-hidden rounded-[10px] border border-ink/15 bg-white transition-colors hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <div className="relative">
                  <div className="relative h-44 overflow-hidden bg-brand-50">
                    {l.media[0] ? (
                      <Image
                        src={l.media[0].url}
                        alt={l.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink/20">
                        <Building2 size={30} />
                      </div>
                    )}
                  </div>
                  <span
                    className={`kunye absolute -bottom-3 left-3 max-w-[85%] truncate ${KUNYE_CLS[l.status] ?? ""}`}
                  >
                    {plaka}
                  </span>
                </div>
                <div className="px-4 pb-4 pt-6">
                  <h3 className="line-clamp-1 text-[15px] font-bold">
                    {l.title}
                  </h3>
                  <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight">
                    {trMoney.format(Number(l.price))}
                    {l.purpose === "RENT" && (
                      <span className="text-sm font-medium text-ink/45">
                        {" "}
                        /ay
                      </span>
                    )}
                  </p>
                  <div className="olcu mt-2.5">
                    <span className="olcu-cizgi" />
                    <span>
                      {l.rooms ?? l.grossArea + " m²"} · net {l.netArea ?? "—"}{" "}
                      m²
                    </span>
                    <span className="olcu-cizgi" />
                  </div>
                  <p className="mt-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink/40">
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
