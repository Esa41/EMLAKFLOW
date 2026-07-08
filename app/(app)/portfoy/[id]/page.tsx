import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { findMatchingLeads } from "@/lib/matching";
import { ListingForm } from "@/components/listing-form";
import { DeleteListingButton } from "@/components/delete-listing-button";
import { ContractPanel } from "@/components/contract-panel";
import { OwnerReport } from "@/components/owner-report";
import { STATUS_TR, STATUS_BADGE } from "@/lib/labels";
import { getVertical } from "@/lib/verticals";
import { Eye } from "lucide-react";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const { id } = await params;

  const [listing, tenant, contacts] = await Promise.all([
    db.listing.findUnique({
      where: { id },
      include: { media: { orderBy: { order: "asc" } } },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { slug: true, showcaseEnabled: true, vertical: true },
    }),
    db.contact.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, phone: true },
    }),
  ]);
  if (!listing) notFound();

  const matches =
    listing.status === "ACTIVE" ? await findMatchingLeads(db, listing) : [];
  const matchContacts = matches.length
    ? await db.contact.findMany({
        where: {
          id: {
            in: matches
              .map((m) => m.lead.contactId)
              .filter(Boolean) as string[],
          },
        },
        select: { id: true, fullName: true, phone: true },
      })
    : [];
  const contactOf = (cid: string | null) =>
    matchContacts.find((c) => c.id === cid);

  const vConf = getVertical(tenant?.vertical);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink/45">
            {listing.refCode}
          </p>
          <h1 className="font-display text-[27px] font-extrabold tracking-tight">
            {listing.title}
          </h1>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[listing.status]}`}
          >
            {STATUS_TR[listing.status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tenant?.showcaseEnabled && listing.status === "ACTIVE" && (
            <a
              href={`${vConf.showcaseBase}/${tenant.slug}/ilan/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-brand-600/40 px-3.5 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <Eye size={16} />
              Vitrinde Önizle
            </a>
          )}
          <DeleteListingButton listingId={listing.id} />
        </div>
      </div>

      {/* Eşleşen talepler */}
      {matches.length > 0 && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-emerald-700">
            🎯 Bu ilanla eşleşen {matches.length} açık talep
          </h2>
          <ul className="space-y-2">
            {matches.slice(0, 5).map((m) => {
              const c = contactOf(m.lead.contactId);
              return (
                <li
                  key={m.lead.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-emerald-100"
                >
                  <div>
                    <p className="font-semibold">
                      {c?.fullName ?? "İsimsiz talep"}
                    </p>
                    <p className="text-xs text-ink/55">
                      {m.reasons.join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c?.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="text-xs font-semibold text-brand-600"
                      >
                        {c.phone}
                      </a>
                    )}
                    <span className="rounded-lg bg-emerald-600 px-2 py-1 font-mono text-xs font-bold text-white">
                      %{m.score}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <OwnerReport
        listingId={listing.id}
        owners={contacts.map((c) => ({
          id: c.id,
          name: c.fullName,
          phone: c.phone,
        }))}
      />

      <ContractPanel
        scope={{ listingId: listing.id }}
        contactOptions={contacts}
        listingLabel={`${listing.refCode} — ${listing.title}`}
      />

      <ListingForm
        listingId={listing.id}
        vertical={tenant?.vertical}
        initialMedia={listing.media.map((m) => ({
          id: m.id,
          url: m.url,
          key: m.key,
          thumbUrl: m.thumbUrl,
        }))}
        initial={{
          title: listing.title,
          purpose: listing.purpose,
          type: listing.type,
          status: listing.status,
          price: String(listing.price),
          city: listing.city,
          district: listing.district,
          neighborhood: listing.neighborhood ?? "",
          address: listing.address ?? "",
          lat: listing.lat?.toString() ?? "",
          lng: listing.lng?.toString() ?? "",
          rooms: listing.rooms ?? "",
          grossArea: listing.grossArea?.toString() ?? "",
          netArea: listing.netArea?.toString() ?? "",
          floor: listing.floor?.toString() ?? "",
          totalFloors: listing.totalFloors?.toString() ?? "",
          buildingAge: listing.buildingAge?.toString() ?? "",
          heating: listing.heating ?? "",
          dues: listing.dues?.toString() ?? "",
          deedStatus: listing.deedStatus ?? "",
          creditEligible: listing.creditEligible,
          furnished: listing.furnished,
          inSite: listing.inSite,
          description: listing.description ?? "",
          parcelGeo: listing.parcelGeo ? JSON.stringify(listing.parcelGeo) : "",
          features: listing.features,
          seoTitle: listing.seoTitle ?? "",
          seoDescription: listing.seoDescription ?? "",
          feedEnabled: listing.feedEnabled ?? true,
          vehicleBrand: listing.vehicleBrand ?? "",
          vehicleModel: listing.vehicleModel ?? "",
          vehicleYear: listing.vehicleYear?.toString() ?? "",
          vehicleKm: listing.vehicleKm?.toString() ?? "",
          fuel: listing.fuel ?? "",
          transmission: listing.transmission ?? "",
          engineSize: listing.engineSize ?? "",
          enginePower: listing.enginePower?.toString() ?? "",
          color: listing.color ?? "",
          tramerAmount: listing.tramerAmount?.toString() ?? "",
          plateNumber: listing.plateNumber ?? "",
          exchangeOk: listing.exchangeOk ?? false,
          warrantyOk: listing.warrantyOk ?? false,
          rentDailyPrice: listing.rentDailyPrice?.toString() ?? "",
          rentWeeklyPrice: listing.rentWeeklyPrice?.toString() ?? "",
          rentDeposit: listing.rentDeposit?.toString() ?? "",
        }}
      />
    </div>
  );
}
