import Link from "next/link";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  Sparkles,
  CalendarRange,
  Palette,
  Instagram,
  Clapperboard,
} from "lucide-react";

export default async function SosyalHubPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const [assetCount, queued, published, accounts, brand, recent, studioReady] =
    await Promise.all([
      db.contentAsset.count(),
      db.calendarItem.count({ where: { status: "QUEUED" } }),
      db.socialPost.count({ where: { status: "published" } }),
      db.socialAccount.count(),
      prisma.brandKit.findUnique({
        where: { tenantId: session.tenantId },
        select: { voice: true },
      }),
      db.contentAsset.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          listing: { select: { refCode: true, title: true } },
        },
      }),
      db.studioProject.count({ where: { finalVideoUrl: { not: null } } }),
    ]);

  const cards = [
    {
      href: "/sosyal/planlayici",
      icon: Sparkles,
      title: "AI Planlayıcı",
      desc: "İlandan gönderi, karusel, reel üret",
      meta: `${assetCount} taslak`,
    },
    {
      href: "/sosyal/medya",
      icon: Clapperboard,
      title: "Medya",
      desc: "Stüdyo videoları → Sosyal’e gönder",
      meta: `${studioReady} hazır video`,
    },
    {
      href: "/sosyal/takvim",
      icon: CalendarRange,
      title: "Takvim",
      desc: "Zamanlanmış yayın kuyruğu",
      meta: `${queued} sırada`,
    },
    {
      href: "/sosyal/marka",
      icon: Palette,
      title: "Marka Merkezi",
      desc: "Ses, ton, yasaklı ifadeler",
      meta: brand?.voice ? "Tanımlı" : "Eksik",
    },
    {
      href: "/sosyal/takip",
      icon: Instagram,
      title: "Takip",
      desc: "Bağlı hesaplar ve metrikler",
      meta: `${accounts} hesap · ${published} yayın`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, desc, meta }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-4 transition hover:border-brand-600/30 hover:bg-[var(--app-surface-hover)]"
          >
            <div className="flex items-center gap-2 text-brand-600">
              <Icon size={18} />
              <span className="text-[13px] font-semibold">{title}</span>
            </div>
            <p className="mt-2 text-sm text-ink/55">{desc}</p>
            <p className="mt-3 text-[12px] font-medium text-ink/40 group-hover:text-brand-600">
              {meta}
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Son üretilenler</h2>
          <Link
            href="/sosyal/planlayici"
            className="text-[13px] font-semibold text-brand-600 hover:underline"
          >
            Yeni üret
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-ink/45">
            Henüz içerik yok. Planlayıcıdan bir ilan seçip AI ile üretin.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8">
            {recent.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {a.headline || a.title || "Başlıksız"}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-ink/45">
                    {a.listing
                      ? `${a.listing.refCode} · ${a.listing.title}`
                      : a.format}{" "}
                    · {a.status}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--app-input-bg)] px-2 py-0.5 text-[11px] font-medium text-ink/55">
                  {a.tone || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
