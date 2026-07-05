import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { ContactIcon, Phone, Mail, ArrowLeft, MessageCircle, FileText, CheckCircle2 } from "lucide-react";
import { STAGE_TR, STAGE_COLOR, trMoney } from "@/lib/labels";
import { ActivityFeed } from "@/components/activity-feed";
import { AddDealModal } from "@/components/add-deal-modal";

export default async function ContactDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const [contact, listings] = await Promise.all([
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
    })
  ]);

  if (!contact) return notFound();

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
                {contact.type}
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
          
          <section>
            <h2 className="bolum mb-4">Vitrin Talepleri ({contact.leads.length})</h2>
            {contact.leads.length === 0 ? (
              <p className="text-sm text-ink/50 italic">Talep kaydı yok.</p>
            ) : (
              <div className="space-y-2">
                {contact.leads.map(l => (
                  <div key={l.id} className="rounded-md bg-white p-3 text-sm border border-ink/10 shadow-sm flex items-start gap-2">
                     <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
                     <p>{l.note || `${l.purpose === "SALE" ? "Satılık" : "Kiralık"} arayışı (${l.district || "Bölge yok"})`}</p>
                  </div>
                ))}
              </div>
            )}
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
