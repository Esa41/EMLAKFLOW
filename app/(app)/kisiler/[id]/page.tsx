import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { ContactIcon, Phone, Mail, ArrowLeft, MessageCircle } from "lucide-react";
import { STAGE_TR, STAGE_COLOR, trMoney, CONTACT_TYPE_TR } from "@/lib/labels";
import { ActivityFeed } from "@/components/activity-feed";
import { ContractPanel } from "@/components/contract-panel";
import { AddDealModal } from "@/components/add-deal-modal";
import { AddLeadModal } from "@/components/add-lead-modal";
import { LeadCard, type LeadRow } from "@/components/lead-card";
import { findMatchingListings } from "@/lib/matching";
import { createManualDeal } from "@/app/actions/deal";
import { prisma } from "@/lib/prisma";
import { isAutoVertical } from "@/lib/verticals";

export default async function ContactDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const [contact, listings, tenant] = await Promise.all([
    db.contact.findUnique({
      where: { id: params.id },
      include: {
        deals: {
          include: { listing: { select: { refCode: true, title: true, price: true } } },
          orderBy: { updatedAt: "desc" },
        },
        leads: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, refCode: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { vertical: true, city: true },
    }),
  ]);

  if (!contact) return notFound();

  const isAuto = isAutoVertical(tenant?.vertical);
  const leadRows: LeadRow[] = contact.leads.map((l) => ({
    id: l.id,
    purpose: l.purpose,
    type: l.type,
    status: l.status,
    source: l.source,
    city: l.city,
    district: l.district,
    rooms: l.rooms,
    minArea: l.minArea,
    maxArea: l.maxArea,
    minPrice: l.minPrice?.toString() ?? null,
    maxPrice: l.maxPrice?.toString() ?? null,
    needsCredit: l.needsCredit,
    vehicleBrand: l.vehicleBrand,
    vehicleModel: l.vehicleModel,
    minYear: l.minYear,
    maxKm: l.maxKm,
    fuel: l.fuel,
    transmission: l.transmission,
    note: l.note,
    createdAt: l.createdAt.toISOString(),
  }));

  // Talebe uyan aktif ilanlar (ters eşleştirme) — en yeni talep baz alınır.
  // Zaten fırsat açılmış ilanlar listeden çıkarılır.
  const latestLead = contact.leads[0];
  const dealtListingIds = new Set(
    contact.deals.map((d) => d.listingId).filter(Boolean) as string[],
  );
  const matches = latestLead
    ? (await findMatchingListings(db, latestLead, 55))
        .filter((m) => !dealtListingIds.has(m.listing.id))
        .slice(0, 5)
    : [];

  // WhatsApp format: +90555... or remove spaces
  const waPhone = contact.phone ? contact.phone.replace(/[\s\(\)-]/g, "") : "";
  const waUrl = waPhone ? `https://wa.me/${waPhone.startsWith("0") ? "9" + waPhone : waPhone}` : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div>
        <Link href="/kisiler" className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink mb-4">
          <ArrowLeft size={16} /> Müşterilere Dön
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <ContactIcon size={32} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight">{contact.fullName}</h1>
              <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold uppercase text-slate-500">
                {CONTACT_TYPE_TR[contact.type] ?? contact.type}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 rounded-lg border border-ink/20 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50">
                <Phone size={16} /> Ara
              </a>
            )}
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-transparent bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 rounded-lg border border-ink/20 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50">
                <Mail size={16} /> E-posta
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol Sütun: Detaylar ve Fırsatlar */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-ink/15 bg-white p-6 shadow-sm">
            <h2 className="bolum mb-4">İletişim Bilgileri</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-mono text-[10px] uppercase text-ink/50">Telefon</p>
                <p className="font-medium mt-0.5">{contact.phone || "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-ink/50">E-Posta</p>
                <p className="font-medium mt-0.5">{contact.email || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="font-mono text-[10px] uppercase text-ink/50">Not</p>
                <p className="mt-0.5">{contact.note || "—"}</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="bolum">İlgilendiği Fırsatlar ({contact.deals.length})</h2>
              <AddDealModal contactId={contact.id} listings={listings} />
            </div>
            {contact.deals.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink/25 bg-white/50 px-4 py-6 text-center text-sm text-ink/50">
                Kayıtlı bir fırsat bulunamadı.
              </p>
            ) : (
              <div className="space-y-3">
                {contact.deals.map(d => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_COLOR[d.stage] }} />
                      <div>
                        <p className="font-bold text-sm">{d.listing ? d.listing.title : "İlansız Talep"}</p>
                        <p className="font-mono text-[11px] text-ink/55 mt-0.5">
                          {STAGE_TR[d.stage]} {d.listing && `· ${d.listing.refCode}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-extrabold">{d.value ? trMoney.format(Number(d.value)) : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Talebe uyan aktif ilanlar — tek tık fırsat aç */}
          {matches.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="bolum">Uygun İlanlar ({matches.length})</h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                  Talep–portföy eşleştirmesi
                </span>
              </div>
              <div className="space-y-3">
                {matches.map((m) => (
                  <div
                    key={m.listing.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                          %{m.score}
                        </span>
                        <Link
                          href={`/portfoy/${m.listing.id}`}
                          className="truncate text-sm font-bold hover:text-brand-700"
                        >
                          {m.listing.title}
                        </Link>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-ink/55">
                        {m.listing.refCode} · {trMoney.format(Number(m.listing.price))}
                        {m.reasons.length > 0 && ` · ${m.reasons.slice(0, 2).join(", ")}`}
                      </p>
                    </div>
                    <form action={createManualDeal} className="shrink-0">
                      <input type="hidden" name="contactId" value={contact.id} />
                      <input type="hidden" name="listingId" value={m.listing.id} />
                      <input type="hidden" name="value" value={Number(m.listing.price)} />
                      <button
                        type="submit"
                        className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                      >
                        + Fırsat aç
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="bolum">
                Talepler ({contact.leads.length})
              </h2>
              <AddLeadModal
                contactId={contact.id}
                isAuto={isAuto}
                defaultCity={tenant?.city}
              />
            </div>
            {leadRows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink/25 bg-white/50 px-4 py-6 text-center text-sm text-ink/50">
                Henüz talep yok. Vitrinden gelen veya manuel eklediğiniz arama kriterleri burada listelenir.
              </p>
            ) : (
              <div className="space-y-3">
                {leadRows.map((l) => (
                  <LeadCard key={l.id} lead={l} isAuto={isAuto} />
                ))}
              </div>
            )}
          </section>

          <section>
            <ContractPanel
              scope={{ contactId: contact.id }}
              contactLabel={contact.fullName}
            />
          </section>
        </div>

        {/* Sağ Sütun: Aktivite ve Notlar */}
        <div className="lg:col-span-1">
          <ActivityFeed contactId={contact.id} entity="contact" />
        </div>
      </div>
    </div>
  );
}
