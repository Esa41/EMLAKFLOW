import Link from "next/link";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { Contact as ContactIcon, Phone, Mail, FileText } from "lucide-react";

export default async function KisilerPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const contacts = await db.contact.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      deals: { select: { id: true } },
      leads: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Müşteriler (Rehber)</h1>
        <p className="mt-1 text-sm text-ink/55">
          Toplam {contacts.length} kişi kayıtlı.
        </p>
      </div>

      <div className="rounded-xl border border-ink/15 bg-white shadow-sm overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/50">
            Henüz kayıtlı müşteri yok. Vitrinden talep geldiğinde buraya düşecektir.
          </div>
        ) : (
          <ul className="divide-y divide-ink/10">
            {contacts.map((c) => (
              <li key={c.id}>
                <Link href={`/kisiler/${c.id}`} className="group flex items-center justify-between p-4 transition-colors hover:bg-brand-50/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <ContactIcon size={18} />
                    </div>
                    <div>
                      <p className="font-bold group-hover:text-brand-700 transition-colors">{c.fullName}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink/60">
                        {c.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} /> {c.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                          <FileText size={13} /> {c.deals.length} Fırsat · {c.leads.length} Talep
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
                      {c.type}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
