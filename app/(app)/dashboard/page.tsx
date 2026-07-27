import Link from "next/link";
import { isPremium } from "@/lib/plans-config";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { ParselMap, type ParselDeal } from "@/components/parsel-map";
import { InsightList, type InsightItem } from "@/components/insight-list";
import { CountUp } from "@/components/landing/count-up";
import { STAGE_TR, STAGE_COLOR, trMoney } from "@/lib/labels";
import {
  Building2,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Wallet,
  Plus,
  CalendarPlus,
  UserPlus,
  Target,
  Landmark,
} from "lucide-react";
import { SetupChecklist } from "@/components/setup-checklist";
import { showcaseUrl } from "@/lib/url";
import { SHOWCASE_INDEX_MIN_LISTINGS } from "@/lib/seo";
import { getVertical } from "@/lib/verticals";

function compactMoney(n: number) {
  if (n >= 1_000_000)
    return `₺${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000)
    return `₺${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}B`;
  return trMoney.format(n);
}

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="dash-section-title">{title}</h2>
      <Link href={href} className="dash-link">
        {linkLabel} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const monthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
  const monthEnd = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, 1);
  // Önceki ay — "bu ay kapanan" metriğinin değişim (▲/▼) karşılaştırması için
  const prevMonthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth() - 1, 1);

  const tenantBrand = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      plan: true,
      brandName: true,
      name: true,
      slug: true,
      vertical: true,
      showcaseEnabled: true,
      showcaseHeadline: true,
      aboutText: true,
      customDomain: true,
    },
  });
  const whiteLabelName =
    tenantBrand && isPremium(tenantBrand.plan)
      ? tenantBrand.brandName?.trim() || tenantBrand.name
      : null;

  const [
    openDeals,
    activeListings,
    openLeads,
    latestListings,
    todaysAppointments,
    insights,
    activeRentals,
    monthPaid,
    monthDue,
    overdue,
    upcomingPayments,
    monthWon,
    prevMonthWon,
  ] = await Promise.all([
    db.deal.findMany({
      where: {
        stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
        value: { not: null },
      },
      orderBy: { value: "desc" },
      include: {
        contact: { select: { fullName: true } },
        listing: { select: { refCode: true, title: true } },
      },
    }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.lead.count({ where: { status: "OPEN" } }),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { media: { orderBy: { order: "asc" }, take: 1 } },
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: startOfDay, lt: endOfDay } },
      orderBy: { startsAt: "asc" },
      include: {
        contact: true,
        listing: true,
        agent: { select: { name: true } },
      },
    }),
    db.insight.findMany({
      where: { dismissedAt: null },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        rule: true,
        severity: true,
        title: true,
        body: true,
        listingId: true,
      },
    }),
    db.rentalAgreement.count({ where: { status: "ACTIVE" } }),
    db.rentPayment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { not: null }, dueDate: { gte: monthStart, lt: monthEnd } },
    }),
    db.rentPayment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { paidAt: null, dueDate: { gte: monthStart, lt: monthEnd } },
    }),
    db.rentPayment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { paidAt: null, dueDate: { lt: startOfDay } },
    }),
    db.rentPayment.findMany({
      where: { paidAt: null, dueDate: { gte: startOfDay } },
      orderBy: { dueDate: "asc" },
      take: 4,
      include: {
        agreement: {
          select: { id: true, title: true, contact: { select: { fullName: true } } },
        },
      },
    }),
    // Bu ay kazanılan işlemler — panelin "nasıl gidiyorum" metriği
    db.deal.aggregate({
      _sum: { value: true },
      _count: true,
      where: { stage: "CLOSED_WON", closedAt: { gte: monthStart, lt: monthEnd } },
    }),
    db.deal.aggregate({
      _sum: { value: true },
      where: {
        stage: "CLOSED_WON",
        closedAt: { gte: prevMonthStart, lt: monthStart },
      },
    }),
  ]);

  const monthPaidTotal = Number(monthPaid._sum.amount ?? 0);
  const monthDueTotal = Number(monthDue._sum.amount ?? 0);
  const overdueTotal = Number(overdue._sum.amount ?? 0);
  const monthTarget = monthPaidTotal + monthDueTotal;
  const collectRate =
    monthTarget > 0 ? Math.round((monthPaidTotal / monthTarget) * 100) : 0;
  const showRentals = activeRentals > 0 || monthTarget > 0 || overdueTotal > 0;

  const parselDeals: ParselDeal[] = openDeals.map((d) => ({
    id: d.id,
    name: d.contact?.fullName ?? "İsimsiz fırsat",
    listing: d.listing ? `${d.listing.refCode} · ${d.listing.title}` : "İlansız",
    value: Number(d.value),
    stage: d.stage,
    stageLabel: STAGE_TR[d.stage],
    color: STAGE_COLOR[d.stage],
  }));
  const pipelineTotal = parselDeals.reduce((s, d) => s + d.value, 0);

  const hour = Number(
    new Intl.DateTimeFormat("tr-TR", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Istanbul",
    }).format(new Date()),
  );
  const greeting =
    hour < 6
      ? "İyi geceler"
      : hour < 12
        ? "Günaydın"
        : hour < 18
          ? "Tünaydın"
          : hour < 22
            ? "İyi akşamlar"
            : "İyi geceler";
  const dateLine = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const firstName = session.name.split(" ")[0];

  const statusLine = [
    todaysAppointments.length > 0
      ? `${todaysAppointments.length} randevu bugün`
      : "Bugün randevu yok",
    openLeads > 0 ? `${openLeads} açık talep` : null,
    activeListings > 0 ? `${activeListings} ilan yayında` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const monthWonTotal = Number(monthWon._sum.value ?? 0);
  const prevWonTotal = Number(prevMonthWon._sum.value ?? 0);
  /* Değişim yüzdesi — geçen ay sıfırsa oran tanımsızdır, gösterme
     (0'dan artışı "%∞" ya da "%100" diye yazmak yanıltıcı olur). */
  const wonDelta =
    prevWonTotal > 0
      ? Math.round(((monthWonTotal - prevWonTotal) / prevWonTotal) * 100)
      : null;

  const kpis = [
    {
      icon: Landmark,
      label: "Açık pipeline",
      value: pipelineTotal > 0 ? compactMoney(pipelineTotal) : "—",
      sub: `${parselDeals.length} aktif fırsat`,
      href: "/musteriler",
      money: true,
      delta: null as number | null,
    },
    {
      icon: Wallet,
      label: "Bu ay kapanan",
      value: monthWonTotal > 0 ? compactMoney(monthWonTotal) : "—",
      sub: `${monthWon._count} işlem`,
      href: "/musteriler",
      money: true,
      delta: wonDelta,
    },
    {
      icon: Building2,
      label: "Yayında ilan",
      value: activeListings,
      sub: "vitrinde canlı",
      href: "/portfoy",
      money: false,
      delta: null as number | null,
    },
    {
      icon: Target,
      label: "Açık talep",
      value: openLeads,
      sub: "eşleşme bekliyor",
      href: "/kisiler",
      money: false,
      delta: null as number | null,
    },
  ];

  // ── Aktivasyon (yeni ofis kurulumu) ──
  const vConf = getVertical(tenantBrand?.vertical);
  const setupComplete =
    activeListings > 0 && !!tenantBrand?.showcaseHeadline?.trim();
  const shareUrl = tenantBrand?.slug
    ? showcaseUrl(tenantBrand.slug, tenantBrand.vertical, tenantBrand.customDomain || null)
    : "";
  const suggestedHeadline =
    vConf.key === "AUTO_DEALER"
      ? "Aradığınız araç, künyesiyle burada."
      : "Aradığınız mülke, güvenle giden yol.";
  const suggestedAbout = `${tenantBrand?.name ?? "Ofisimiz"} olarak ilanları yerinde inceler; fiyatı, metrekaresini ve ${vConf.key === "AUTO_DEALER" ? "ekspertizini" : "tapu durumunu"} olduğu gibi paylaşırız. Aradığınızı bulamazsanız, uygun ${vConf.key === "AUTO_DEALER" ? "araç" : "mülk"} girdiği an sizi ararız.`;

  return (
    <div className="dash-shell mx-auto max-w-[1200px]">
      {!setupComplete && tenantBrand && (
        <SetupChecklist
          hasListing={activeListings > 0}
          hasIdentity={!!tenantBrand.showcaseHeadline?.trim()}
          shareUrl={shareUrl}
          showcaseEnabled={tenantBrand.showcaseEnabled}
          suggestedHeadline={suggestedHeadline}
          suggestedAbout={suggestedAbout}
        />
      )}

      {/* ── Karşılama ── */}
      <div className="dash-in">
        <p className="text-[13px] font-medium text-ink/45">{dateLine}</p>
        <h1 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/55">{statusLine}</p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link href="/portfoy/yeni" className="dash-btn-primary">
            <Plus size={15} /> Yeni ilan
          </Link>
          <Link href="/kisiler" className="dash-btn-secondary">
            <UserPlus size={15} /> Kişi ekle
          </Link>
          <Link href="/ajanda" className="dash-btn-secondary">
            <CalendarPlus size={15} /> Randevu
          </Link>
        </div>
      </div>

      {/* ── Aksiyon uyarısı — KPI'ların ÜSTÜNDE (durum değil, yapılacak iş) ── */}
      {overdue._count > 0 && (
        <Link
          href="/kiralar"
          className="dash-alert-danger dash-in mt-6"
          style={{ animationDelay: "80ms" }}
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span className="min-w-0 flex-1">
            {overdue._count} kira ödemesi gecikti —{" "}
            <span className="tabular-nums">{trMoney.format(overdueTotal)}</span>
          </span>
          <ArrowRight size={15} className="shrink-0" />
        </Link>
      )}

      {/* ── Google görünürlük bilgisi ──
          Vitrin az ilanlıyken noindex alıyor (ince içerik kapısı). Bunu
          söylememek "sitem neden Google'da yok" sorusuna yol açar. */}
      {tenantBrand?.showcaseEnabled &&
        activeListings > 0 &&
        activeListings < SHOWCASE_INDEX_MIN_LISTINGS && (
          <Link
            href="/portfoy/yeni"
            className="dash-in mt-6 flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-[var(--app-surface)] px-4 py-3 text-[13px] transition hover:bg-[var(--app-surface-hover)]"
            style={{ animationDelay: "90ms" }}
          >
            <Building2 size={15} className="shrink-0 text-ink/40" />
            <span className="min-w-0 flex-1 text-ink/70">
              Vitriniz Google&apos;da listelenmesi için{" "}
              <strong className="text-ink">
                {SHOWCASE_INDEX_MIN_LISTINGS - activeListings} ilan daha
              </strong>{" "}
              gerekiyor. Az ilanlı siteler aramada gösterilmiyor.
            </span>
            <ArrowRight size={15} className="shrink-0 text-ink/30" />
          </Link>
        )}

      {/* ── KPI şeridi ── */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
        {kpis.map((k, i) => (
          <Link
            key={k.label}
            href={k.href}
            className="dash-kpi dash-in group"
            style={{ animationDelay: `${100 + i * 60}ms` }}
          >
            <div className="relative flex items-start justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/[0.04] text-ink/60 transition-colors group-hover:bg-ink group-hover:text-white">
                <k.icon size={16} strokeWidth={1.75} />
              </span>
              <ArrowUpRight
                size={14}
                className="text-ink/20 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
              />
            </div>
            <p className="relative mt-3 font-display text-[26px] font-bold leading-none tracking-tight tabular-nums">
              {k.money ? k.value : <CountUp to={Number(k.value)} duration={900} />}
            </p>
            <div className="relative mt-1.5 flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-ink/75">{k.label}</p>
              {k.delta !== null && (
                <span
                  className={`dash-delta ${k.delta > 0 ? "dash-delta-up" : k.delta < 0 ? "dash-delta-down" : ""}`}
                  title={`Geçen aya göre %${Math.abs(k.delta)}`}
                >
                  {k.delta > 0 ? "▲" : k.delta < 0 ? "▼" : "•"}
                  {Math.abs(k.delta)}%
                </span>
              )}
            </div>
            <p className="relative text-[12px] text-ink/40">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* ── Ana grid ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Satış hattı */}
          <section className="dash-card dash-in p-4 sm:p-5" style={{ animationDelay: "280ms" }}>
            <SectionHeader title="Satış hattı" href="/musteriler" linkLabel="Kanban" />
            <div className="mt-5">
              <ParselMap deals={parselDeals} />
            </div>
          </section>

          {/* Son ilanlar */}
          <section className="dash-in" style={{ animationDelay: "340ms" }}>
            <SectionHeader title="Son yayınlananlar" href="/portfoy" linkLabel="Portföy" />
            {latestListings.length === 0 ? (
              <div className="dash-empty mt-4">
                Henüz ilan yok.{" "}
                <Link href="/portfoy/yeni" className="font-semibold text-brand-600 hover:underline">
                  İlk ilanını ekle
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {latestListings.map((l) => (
                  <Link
                    key={l.id}
                    href={`/portfoy/${l.id}`}
                    className="dash-listing-card group"
                  >
                    <div className="relative">
                      <div className="relative h-36 overflow-hidden rounded-t-[18px] bg-ink/[0.03]">
                        {l.media[0] ? (
                          <Image
                            src={l.media[0].cardUrl ?? l.media[0].url}
                            alt={l.title}
                            fill
                            loading="lazy"
                            sizes="(min-width: 640px) 33vw, 100vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-ink/15">
                            <Building2 size={28} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink/70 shadow-sm backdrop-blur-sm dark:bg-black/60 dark:text-white/85">
                        {l.title}
                      </span>
                    </div>
                    <div className="px-4 pb-4 pt-3">
                      <p className="font-display text-[17px] font-bold tracking-tight tabular-nums">
                        {trMoney.format(Number(l.price))}
                        {l.purpose === "RENT" && (
                          <span className="text-[13px] font-medium text-ink/40"> /ay</span>
                        )}
                      </p>
                      <p className="mt-1 text-[12px] text-ink/45">
                        {l.rooms ?? "—"} · net {l.netArea ?? "—"} m²
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sağ kolon */}
        <div className="space-y-4">
          {/* Bugünün rotası */}
          <section className="dash-card dash-in p-4 sm:p-5" style={{ animationDelay: "300ms" }}>
            <SectionHeader title="Bugünün rotası" href="/ajanda" linkLabel="Ajanda" />
            {todaysAppointments.length === 0 ? (
              <div className="dash-empty mt-4">Bugün planlanmış randevu yok.</div>
            ) : (
              <div className="mt-4 space-y-1">
                {todaysAppointments.map((a, idx) => (
                  <div
                    key={a.id}
                    className={`dash-timeline-item ${idx < todaysAppointments.length - 1 ? "pb-4" : ""}`}
                  >
                    <p className="text-[12px] font-semibold tabular-nums text-brand-600">
                      {a.startsAt.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-0.5 text-[14px] font-semibold leading-snug">{a.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink/45">
                      {a.contact?.fullName ?? "—"}
                      {a.listing && ` · ${a.listing.refCode}`}
                      {a.agent && ` · ${a.agent.name}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Kira & Finans */}
          {showRentals && (
            <section className="dash-card dash-in p-4 sm:p-5" style={{ animationDelay: "360ms" }}>
              <SectionHeader title="Kira & finans" href="/kiralar" linkLabel="Tümü" />
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink/50">
                    <Wallet size={14} className="text-brand-600" /> Bu ay tahsilat
                  </p>
                  <p className="text-[13px] font-semibold tabular-nums text-ink/55">%{collectRate}</p>
                </div>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight tabular-nums text-brand-700">
                  {trMoney.format(monthPaidTotal)}
                  <span className="ml-1.5 text-[14px] font-medium text-ink/35">
                    / {trMoney.format(monthTarget)}
                  </span>
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.06]">
                  <div
                    className="dash-bar h-full rounded-full bg-brand-600"
                    style={{ width: `${collectRate}%` }}
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink/45">
                  <span>{activeRentals} aktif sözleşme</span>
                  {monthDueTotal > 0 && (
                    <span>Bekleyen {trMoney.format(monthDueTotal)}</span>
                  )}
                </div>

                {/* Geciken tahsilat uyarısı sayfanın EN ÜSTÜNE taşındı
                    (aksiyon gerektiren iş, kart içinde gömülü kalmamalı). */}

                {upcomingPayments.length > 0 && (
                  <div className="mt-4 border-t border-ink/[0.06] pt-4">
                    <p className="text-[12px] font-medium text-ink/40">Yaklaşan ödemeler</p>
                    <ul className="mt-2.5 space-y-2">
                      {upcomingPayments.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-3 text-[13px]"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            <span className="font-medium">{p.agreement.title}</span>
                            {p.agreement.contact && (
                              <span className="text-ink/40">
                                {" "}
                                · {p.agreement.contact.fullName}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-right tabular-nums">
                            <span className="font-semibold">
                              {trMoney.format(Number(p.amount))}
                            </span>
                            <span className="ml-2 text-[11px] text-ink/35">
                              {p.dueDate.toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="dash-in" style={{ animationDelay: "400ms" }}>
            <InsightList insights={insights as InsightItem[]} />
          </div>
        </div>
      </div>
    </div>
  );
}
