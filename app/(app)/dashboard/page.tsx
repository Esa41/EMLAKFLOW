import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { InsightList, type InsightItem } from "@/components/insight-list";
import { CountUp } from "@/components/landing/count-up";
import { trMoney } from "@/lib/labels";
import {
  ArrowRight,
  AlertTriangle,
  Wallet,
  Plus,
  CalendarPlus,
  UserPlus,
} from "lucide-react";
import { SetupChecklist } from "@/components/setup-checklist";
import { showcaseUrl } from "@/lib/url";
import { getVertical } from "@/lib/verticals";
import {
  ActiveListingsPanel,
  type ActiveListingRow,
} from "@/components/dashboard/active-listings-panel";
import {
  BarPairChart,
  LineChart,
  ScoreGauge,
  Sparkline,
} from "@/components/dashboard/urbn-charts";

function compactMoney(n: number) {
  if (n >= 1_000_000)
    return `₺${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000)
    return `₺${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}B`;
  return trMoney.format(n);
}

function weekKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Pazartesi=0
  x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

function lastNWeeks(n: number) {
  const out: Date[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = (now.getDay() + 6) % 7;
  now.setDate(now.getDate() - day);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    out.push(d);
  }
  return out;
}

function pctDelta(curr: number, prev: number) {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <p className={`dash-trend ${up ? "dash-trend-up" : "dash-trend-down"}`}>
      <span aria-hidden>{up ? "↗" : "↘"}</span> {Math.abs(value)}% Geçen hafta
    </p>
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

  const weeks = lastNWeeks(8);
  const rangeStart = weeks[0]!;
  const thisWeekStart = weeks[weeks.length - 1]!;
  const last14 = new Date(startOfDay);
  last14.setDate(last14.getDate() - 14);
  const last30 = new Date(startOfDay);
  last30.setDate(last30.getDate() - 30);

  const tenantBrand = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      name: true,
      slug: true,
      vertical: true,
      showcaseEnabled: true,
      showcaseHeadline: true,
      customDomain: true,
    },
  });
  const [
    openDeals,
    activeListingsCount,
    openLeads,
    activeListings,
    todaysAppointments,
    insights,
    activeRentals,
    monthPaid,
    monthDue,
    overdue,
    upcomingPayments,
    closedWonRecent,
    leadsRecent,
    closedOutcomes,
    freshListings,
    team,
  ] = await Promise.all([
    db.deal.findMany({
      where: {
        stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
        value: { not: null },
      },
      select: { id: true, stage: true, value: true },
    }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.lead.count({ where: { status: "OPEN" } }),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        purpose: true,
        price: true,
        rooms: true,
        netArea: true,
        createdAt: true,
        media: { orderBy: { order: "asc" }, take: 1, select: { cardUrl: true, url: true } },
      },
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
    db.deal.findMany({
      where: {
        stage: "CLOSED_WON",
        OR: [
          { closedAt: { gte: rangeStart } },
          { AND: [{ closedAt: null }, { updatedAt: { gte: rangeStart } }] },
        ],
      },
      select: { value: true, closedAt: true, updatedAt: true, createdAt: true },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
    db.deal.findMany({
      where: {
        stage: { in: ["CLOSED_WON", "CLOSED_LOST"] },
        OR: [
          { closedAt: { gte: last30 } },
          { AND: [{ closedAt: null }, { updatedAt: { gte: last30 } }] },
        ],
      },
      select: { stage: true },
    }),
    db.listing.count({
      where: { status: "ACTIVE", updatedAt: { gte: last14 } },
    }),
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
      take: 6,
      select: { id: true, name: true, photoUrl: true, avatarUrl: true, role: true },
    }),
  ]);

  const monthPaidTotal = Number(monthPaid._sum.amount ?? 0);
  const monthDueTotal = Number(monthDue._sum.amount ?? 0);
  const overdueTotal = Number(overdue._sum.amount ?? 0);
  const monthTarget = monthPaidTotal + monthDueTotal;
  const collectRate =
    monthTarget > 0 ? Math.round((monthPaidTotal / monthTarget) * 100) : 0;
  const showRentals = activeRentals > 0 || monthTarget > 0 || overdueTotal > 0;

  const pipelineTotal = openDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);

  // Haftalık seriler
  const wonByWeek = new Map<string, { count: number; value: number }>();
  const leadByWeek = new Map<string, number>();
  for (const w of weeks) {
    wonByWeek.set(weekKey(w), { count: 0, value: 0 });
    leadByWeek.set(weekKey(w), 0);
  }
  for (const d of closedWonRecent) {
    const when = d.closedAt ?? d.updatedAt ?? d.createdAt;
    const k = weekKey(when);
    const slot = wonByWeek.get(k);
    if (slot) {
      slot.count += 1;
      slot.value += Number(d.value ?? 0);
    }
  }
  for (const l of leadsRecent) {
    const k = weekKey(l.createdAt);
    if (leadByWeek.has(k)) leadByWeek.set(k, (leadByWeek.get(k) ?? 0) + 1);
  }

  const weekLabels = weeks.map((w) =>
    w.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
  );
  const salesValueSeries = weeks.map((w) => wonByWeek.get(weekKey(w))!.value);
  const salesCountSeries = weeks.map((w) => wonByWeek.get(weekKey(w))!.count);
  const leadSeries = weeks.map((w) => leadByWeek.get(weekKey(w))!);

  // Önceki dönem (aynı uzunlukta geriye kaydırılmış) — çizgide gri seri
  const prevValueSeries = salesValueSeries.map((_, i) =>
    i === 0 ? salesValueSeries[0]! : salesValueSeries[i - 1]!,
  );

  const thisWeekSales = wonByWeek.get(weekKey(thisWeekStart))!.count;
  const prevWeekSales = salesCountSeries[salesCountSeries.length - 2] ?? 0;
  const thisWeekLeads = leadByWeek.get(weekKey(thisWeekStart))!;
  const prevWeekLeads = leadSeries[leadSeries.length - 2] ?? 0;

  const salesDelta = pctDelta(thisWeekSales, prevWeekSales);
  const leadsDelta = pctDelta(thisWeekLeads, prevWeekLeads);

  // Smart Score 0–100
  const advanced = openDeals.filter((d) =>
    ["VIEWING", "OFFER", "CONTRACT"].includes(d.stage),
  ).length;
  const pipelineScore =
    openDeals.length === 0 ? 35 : Math.round((advanced / openDeals.length) * 100);
  const wonN = closedOutcomes.filter((d) => d.stage === "CLOSED_WON").length;
  const lostN = closedOutcomes.filter((d) => d.stage === "CLOSED_LOST").length;
  const winScore =
    wonN + lostN === 0 ? 45 : Math.round((wonN / (wonN + lostN)) * 100);
  const listingScore =
    activeListingsCount === 0
      ? 20
      : Math.round((freshListings / activeListingsCount) * 100);
  const smartScore = Math.round(
    pipelineScore * 0.35 + winScore * 0.35 + listingScore * 0.3,
  );
  const prevSmartApprox = Math.max(
    0,
    Math.min(100, smartScore - Math.round((salesDelta + leadsDelta) / 10)),
  );
  const scoreDelta = smartScore - prevSmartApprox;

  const totalSalesValue = salesValueSeries.reduce((a, b) => a + b, 0);
  const totalSalesCount = salesCountSeries.reduce((a, b) => a + b, 0);

  // Bar çiftleri: son 6 hafta bu dönem vs bir önceki
  const barWeeks = weeks.slice(-6);
  const barPairs = barWeeks.map((w, i) => {
    const idx = weeks.length - 6 + i;
    return {
      a: salesCountSeries[idx] ?? 0,
      b: idx > 0 ? (salesCountSeries[idx - 1] ?? 0) : 0,
    };
  });
  const barLabels = barWeeks.map((w) =>
    w.toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
  );

  const listingRows: ActiveListingRow[] = activeListings.map((l) => {
    const days = Math.max(
      0,
      Math.floor((startOfDay.getTime() - l.createdAt.getTime()) / 86_400_000),
    );
    return {
      id: l.id,
      title: l.title,
      purpose: l.purpose,
      price: Number(l.price),
      rooms: l.rooms,
      netArea: l.netArea,
      createdAt: l.createdAt.toISOString(),
      daysActive: days,
      thumb: l.media[0]?.cardUrl ?? l.media[0]?.url ?? null,
    };
  });

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

  const vConf = getVertical(tenantBrand?.vertical);
  const setupComplete =
    activeListingsCount > 0 && !!tenantBrand?.showcaseHeadline?.trim();
  const shareUrl = tenantBrand?.slug
    ? showcaseUrl(tenantBrand.slug, tenantBrand.vertical, tenantBrand.customDomain || null)
    : "";
  const suggestedHeadline =
    vConf.key === "AUTO_DEALER"
      ? "Aradığınız araç, künyesiyle burada."
      : "Aradığınız mülke, güvenle giden yol.";
  const suggestedAbout = `${tenantBrand?.name ?? "Ofisimiz"} olarak ilanları yerinde inceler; fiyatı, metrekaresini ve ${vConf.key === "AUTO_DEALER" ? "ekspertizini" : "tapu durumunu"} olduğu gibi paylaşırız. Aradığınızı bulamazsanız, uygun ${vConf.key === "AUTO_DEALER" ? "araç" : "mülk"} girdiği an sizi ararız.`;

  return (
    <div className="dash-shell dash-urbn mx-auto max-w-[1180px]">
      {!setupComplete && tenantBrand && (
        <SetupChecklist
          hasListing={activeListingsCount > 0}
          hasIdentity={!!tenantBrand.showcaseHeadline?.trim()}
          shareUrl={shareUrl}
          showcaseEnabled={tenantBrand.showcaseEnabled}
          suggestedHeadline={suggestedHeadline}
          suggestedAbout={suggestedAbout}
        />
      )}

      {/* ── Üst şerit ── */}
      <div className="dash-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink/40">
            {dateLine}
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.6rem,3.5vw,2.1rem)] font-bold leading-[1.1] tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 text-[13px] text-ink/50">
            {pipelineTotal > 0
              ? `Açık pipeline ${compactMoney(pipelineTotal)} · ${openDeals.length} fırsat`
              : `${activeListingsCount} yayında ilan · ${openLeads} açık talep`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/portfoy/yeni" className="dash-btn-primary">
            <Plus size={15} /> Yeni ilan
          </Link>
          <Link href="/kisiler" className="dash-btn-secondary">
            <UserPlus size={15} /> Kişi
          </Link>
          <Link href="/ajanda" className="dash-btn-secondary">
            <CalendarPlus size={15} /> Randevu
          </Link>
        </div>
      </div>

      {/* ── KPI ── */}
      <div className="mt-7 grid gap-3 md:grid-cols-3">
        <Link
          href="/analitik"
          className="dash-kpi dash-in group"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink/50">Akıllı skor</p>
              <p className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight tabular-nums">
                <CountUp to={smartScore} duration={900} />
                <span className="text-[16px] font-semibold text-ink/35"> / 100</span>
              </p>
              <Trend value={scoreDelta} />
            </div>
            <ScoreGauge score={smartScore} className="mt-1 h-14 w-24 text-ink" />
          </div>
          <span className="dash-more">
            Detay <ArrowRight size={12} />
          </span>
        </Link>

        <Link
          href="/musteriler"
          className="dash-kpi dash-in group"
          style={{ animationDelay: "140ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink/50">Satış adedi</p>
              <p className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight tabular-nums">
                <CountUp to={totalSalesCount} duration={900} />
              </p>
              <Trend value={salesDelta} />
            </div>
            <Sparkline values={salesCountSeries} className="mt-3 h-9 w-24 text-ink" />
          </div>
          <span className="dash-more">
            Detay <ArrowRight size={12} />
          </span>
        </Link>

        <Link
          href="/kisiler"
          className="dash-kpi dash-in group"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink/50">Talepler</p>
              <p className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight tabular-nums">
                <CountUp to={openLeads} duration={900} />
              </p>
              <Trend value={leadsDelta} />
            </div>
            <Sparkline values={leadSeries} className="mt-3 h-9 w-24 text-ink/55" />
          </div>
          <span className="dash-more">
            Detay <ArrowRight size={12} />
          </span>
        </Link>
      </div>

      {/* ── Grafikler ── */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <section
          className="dash-card dash-in p-5 sm:p-6 lg:col-span-2"
          style={{ animationDelay: "260ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink/50">Toplam satış</p>
              <p className="mt-1 font-display text-[28px] font-bold tracking-tight tabular-nums">
                {totalSalesValue > 0 ? compactMoney(totalSalesValue) : compactMoney(pipelineTotal)}
              </p>
              {totalSalesValue === 0 && pipelineTotal > 0 && (
                <p className="mt-0.5 text-[11px] text-ink/40">Açık pipeline değeri</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-ink/45">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded-full bg-ink" /> Bu dönem
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded-full bg-ink/25" /> Önceki
              </span>
            </div>
          </div>
          <LineChart
            className="mt-4 text-ink"
            labels={weekLabels}
            series={[
              { values: salesValueSeries.length ? salesValueSeries : [0, 0], tone: "ink" },
              {
                values: prevValueSeries.length ? prevValueSeries : [0, 0],
                tone: "muted",
              },
            ]}
          />
        </section>

        <section className="dash-card dash-in p-5 sm:p-6" style={{ animationDelay: "300ms" }}>
          <p className="text-[13px] font-medium text-ink/50">Satış sayısı</p>
          <p className="mt-1 font-display text-[28px] font-bold tracking-tight tabular-nums">
            <CountUp to={totalSalesCount} duration={800} />
          </p>
          <BarPairChart className="mt-4" pairs={barPairs} labels={barLabels} />
        </section>
      </div>

      {/* ── Alt grid: ilanlar + sağ kolon ── */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActiveListingsPanel listings={listingRows} />
        </div>

        <div className="space-y-3">
          {/* Ekip */}
          <section className="dash-card dash-in p-5" style={{ animationDelay: "360ms" }}>
            <div className="flex items-center justify-between">
              <h2 className="dash-section-title">Ekip</h2>
              <Link href="/ekip" className="dash-link">
                Tümü <ArrowRight size={12} />
              </Link>
            </div>
            {team.length === 0 ? (
              <div className="dash-empty mt-3">Henüz ekip üyesi yok.</div>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {team.map((u) => {
                  const photo = u.photoUrl ?? u.avatarUrl;
                  const initials = u.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <li key={u.id} className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink/[0.06] text-[11px] font-bold text-ink/70">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold">{u.name}</p>
                        <p className="text-[11px] text-ink/40">
                          {u.role === "OWNER"
                            ? "Sahip"
                            : u.role === "BROKER"
                              ? "Broker"
                              : "Danışman"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Bugünün rotası */}
          <section className="dash-card dash-in p-5" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between">
              <h2 className="dash-section-title">Bugünün rotası</h2>
              <Link href="/ajanda" className="dash-link">
                Ajanda <ArrowRight size={12} />
              </Link>
            </div>
            {todaysAppointments.length === 0 ? (
              <div className="dash-empty mt-3">Bugün randevu yok.</div>
            ) : (
              <div className="mt-3 space-y-1">
                {todaysAppointments.map((a, idx) => (
                  <div
                    key={a.id}
                    className={`dash-timeline-item ${idx < todaysAppointments.length - 1 ? "pb-3.5" : ""}`}
                  >
                    <p className="text-[12px] font-semibold tabular-nums text-ink/70">
                      {a.startsAt.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold leading-snug">{a.title}</p>
                    <p className="mt-0.5 text-[12px] text-ink/45">
                      {a.contact?.fullName ?? "—"}
                      {a.listing && ` · ${a.listing.refCode}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showRentals && (
            <section className="dash-card dash-in p-5" style={{ animationDelay: "440ms" }}>
              <div className="flex items-center justify-between">
                <h2 className="dash-section-title">Kira & finans</h2>
                <Link href="/kiralar" className="dash-link">
                  Tümü <ArrowRight size={12} />
                </Link>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink/50">
                    <Wallet size={14} /> Bu ay tahsilat
                  </p>
                  <p className="text-[13px] font-semibold tabular-nums text-ink/55">
                    %{collectRate}
                  </p>
                </div>
                <p className="mt-2 font-display text-[24px] font-bold tracking-tight tabular-nums">
                  {trMoney.format(monthPaidTotal)}
                  <span className="ml-1.5 text-[13px] font-medium text-ink/35">
                    / {trMoney.format(monthTarget)}
                  </span>
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.06]">
                  <div
                    className="dash-bar h-full rounded-full bg-ink"
                    style={{ width: `${collectRate}%` }}
                  />
                </div>
                {overdue._count > 0 && (
                  <Link
                    href="/kiralar"
                    className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/[0.08] px-3.5 py-2.5 text-[13px] font-medium text-red-700 transition hover:bg-red-500/[0.12] dark:text-red-400"
                  >
                    <AlertTriangle size={14} />
                    {overdue._count} geciken · {trMoney.format(overdueTotal)}
                  </Link>
                )}
                {upcomingPayments.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-ink/[0.06] pt-3">
                    {upcomingPayments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 text-[13px]"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {p.agreement.title}
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold">
                          {trMoney.format(Number(p.amount))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          <div className="dash-in" style={{ animationDelay: "480ms" }}>
            <InsightList insights={insights as InsightItem[]} />
          </div>
        </div>
      </div>
    </div>
  );
}
