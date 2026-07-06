import Link from "next/link";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { CONTACT_TYPE_TR } from "@/lib/labels";
import { AddContactButton } from "@/components/add-contact-button";
import { Contact as ContactIcon, Phone, Mail, FileText, Globe } from "lucide-react";

type Props = { searchParams: Promise<{ vitrin?: string }> };

export default async function KisilerPage({ searchParams }: Props) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const { vitrin } = await searchParams;
  const vitrinOnly = vitrin === "1";

  const contacts = await db.contact.findMany({
    where: vitrinOnly ? { siteUser: { isNot: null } } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      deals: { select: { id: true } },
      leads: { select: { id: true } },
      siteUser: { select: { id: true } },
    },
  });

  const vitrinCount = vitrinOnly
    ? contacts.length
    : await db.contact.count({ where: { siteUser: { isNot: null } } });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[27px] font-extrabold tracking-tight">Müşteriler (Rehber)</h1>
          <p className="mt-1 text-sm text-ink/55">
            Toplam {contacts.length} kişi
            {!vitrinOnly && vitrinCount > 0 ? ` · ${vitrinCount} vitrin üyesi` : ""}
          </p>
        </div>
        <AddContactButton />
      </div>

      <div className="flex gap-2">
        <Link
          href="/kisiler"
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            !vitrinOnly ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tümü
        </Link>
        <Link
          href="/kisiler?vitrin=1"
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            vitrinOnly ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Vitrin üyeleri
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/15 bg-white shadow-sm">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink/50">
            {vitrinOnly
              ? "Henüz vitrin üyesi yok. Vitrin kaydı olan müşteriler burada listelenir."
              : "Henüz kayıtlı müşteri yok. Vitrinden talep geldiğinde veya manuel eklediğinizde buraya düşer."}
          </div>
        ) : (
          <ul className="divide-y divide-ink/10">
            {contacts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kisiler/${c.id}`}
                  className="group flex items-center justify-between p-4 transition-colors hover:bg-brand-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <ContactIcon size={18} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold transition-colors group-hover:text-brand-700">{c.fullName}</p>
                        {c.siteUser && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                            <Globe size={10} />
                            Vitrin üyesi
                          </span>
                        )}
                      </div>
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
                      {CONTACT_TYPE_TR[c.type] ?? c.type}
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
