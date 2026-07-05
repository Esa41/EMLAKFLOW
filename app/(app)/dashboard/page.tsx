import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { ParselMap, type ParselDeal } from "@/components/parsel-map";
import { InsightList, type InsightItem } from "@/components/insight-list";
import { STAGE_TR, STAGE_COLOR, trMoney } from "@/lib/labels";
import { Building2 } from "lucide-react";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [
    openDeals,
    activeListings,
    openLeads,
    latestListings,
    todaysAppointments,
    insights,
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
  ]);

  const parselDeals: ParselDeal[] = openDeals.map((d) => ({
    id: d.id,
    name: d.contact?.fullName ?? "İsimsiz fırsat",
    listing: d.listing
      ? `${d.listing.refCode} · ${d.listing.title}`
      : "İlansız",
    value: Number(d.value),
    stage: d.stage,
    stageLabel: STAGE_TR[d.stage],
    color: STAGE_COLOR[d.stage],
  }));

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
  const weekday = new Date().toLocaleDateString("tr-TR", { weekday: "long" });
  const firstName = session.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
          {weekday} · Günlük Durum
        </p>
        <h1 className="mt-1.5 font-display text-[27px] font-extrabold leading-tight tracking-tight">
          {greeting}, {firstName}.
        </h1>

        <ParselMap deals={parselDeals} />
      </div>

      {/* Sayım satırı — ölçü notasyonu */}
      <div className="flex border-y border-ink/15">
        {[
          [activeListings, "Yayında ilan"],
          [openLeads, "Açık talep"],
          [todaysAppointments.length, "Bugün randevu"],
        ].map(([n, l], i) => (
          <div
            key={l}
            className={`flex-1 py-3.5 text-center ${i > 0 ? "border-l border-ink/10" : ""}`}
          >
            <p className="font-display text-2xl font-extrabold tracking-tight">
              {n}
            </p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/50">
              {l}
            </p>
          </div>
        ))}
      </div>

      {/* Eylem odaklı öneriler (Insight motoru — gecelik üretilir) */}
      <InsightList insights={insights as InsightItem[]} />

      {/* Bugünün rotası — saat rayı */}
      <section>
        <h2 className="bolum">Bugünün Rotası</h2>
        {todaysAppointments.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-ink/25 bg-white/50 px-4 py-6 text-center text-sm text-ink/50">
            Bugün planlanmış randevu yok.
          </p>
        ) : (
          <div className="ml-1.5 mt-4 border-l border-ink">
            {todaysAppointments.map((a) => (
              <div key={a.id} className="relative pb-5 pl-5">
                <span className="absolute -left-1 top-2 h-[7px] w-[7px] rounded-full bg-brand-600" />
                <p className="font-mono text-[11px] font-semibold text-brand-600">
                  {a.startsAt.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-0.5 text-[14.5px] font-bold">{a.title}</p>
                <p className="text-xs text-ink/55">
                  {a.contact?.fullName ?? "—"}
                  {a.listing && ` · ${a.listing.refCode}`}
                  {a.agent && ` · ${a.agent.name}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vitrine son çıkanlar */}
      <section>
        <h2 className="bolum">Vitrine Son Çıkanlar</h2>
        {latestListings.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-ink/25 bg-white/50 px-4 py-6 text-center text-sm text-ink/50">
            Henüz ilan yok.{" "}
            <Link href="/portfoy/yeni" className="font-semibold text-brand-600">
              İlk ilanını ekle
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {latestListings.map((l) => (
              <Link
                key={l.id}
                href={`/portfoy/${l.id}`}
                className="group overflow-hidden rounded-[10px] border border-ink/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <div className="relative">
                  <div className="relative h-40 bg-brand-50">
                    {l.media[0] ? (
                      <Image
                        src={l.media[0].url}
                        alt={l.title}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink/20">
                        <Building2 size={30} />
                      </div>
                    )}
                  </div>
                  <span className="kunye absolute -bottom-3 left-3 shadow-sm">
                    {l.refCode
                      .replace("EF-2026-0", "EF·0")
                      .replace("EF-", "EF·")}{" "}
                    — {(l.neighborhood ?? l.district).toUpperCase()}
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
                      {l.rooms ?? "—"} · net {l.netArea ?? "—"} m²
                    </span>
                    <span className="olcu-cizgi" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
