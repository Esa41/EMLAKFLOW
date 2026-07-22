import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { findMatchingLeads } from "@/lib/matching";
import { ListingForm } from "@/components/listing-form";
import { DeleteListingButton } from "@/components/delete-listing-button";
import { FeaturedToggle } from "@/components/featured-toggle";
import { ContractPanel } from "@/components/contract-panel";
import { OwnerReport } from "@/components/owner-report";
import { STATUS_TR, STATUS_BADGE } from "@/lib/labels";
import { getVertical } from "@/lib/verticals";
import { enabledPortals } from "@/lib/portals";
import { Eye, Heart, Mail, Phone } from "lucide-react";

const favDateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const { id } = await params;

  const [listing, tenant, contacts, favorites] = await Promise.all([
    db.listing.findUnique({
      where: { id },
      include: { media: { orderBy: { order: "asc" } } },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        slug: true,
        showcaseEnabled: true,
        vertical: true,
        portalSahibinden: true,
        portalHepsiemlak: true,
        portalEmlakjet: true,
        portalArabam: true,
        portalSahibindenAuto: true,
      },
    }),
    db.contact.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, phone: true },
    }),
    // Favorite tenant-scoped değil; listing bu ofise ait olduğu için güvenli
    prisma.favorite.findMany({
      where: { listingId: id, siteUser: { tenantId: session.tenantId } },
      orderBy: { createdAt: "desc" },
      include: {
        siteUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            contactId: true,
          },
        },
      },
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
  const portals = enabledPortals(tenant ?? {}, tenant?.vertical).map((p) => ({
    key: p.key,
    label: p.label,
  }));

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
          {listing.status === "ACTIVE" && (
            <FeaturedToggle listingId={listing.id} featured={listing.featured} />
          )}
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

      {/* Vitrin üyelerinin favorileri — otomatik güncellenir */}
      <section className="rounded-[10px] border border-ink/15 bg-white">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Heart size={15} className="text-rose-500" fill="currentColor" />
            Favorileyenler
            <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink/55">
              {favorites.length}
            </span>
          </h2>
          <p className="text-[11px] text-ink/40">Vitrin üyeleri</p>
        </div>
        {favorites.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink/50">
            Henüz kimse bu ilanı favorilemedi. Vitrinde kalp ile ekleyen
            üyeler burada listelenir.
          </p>
        ) : (
          <ul className="divide-y divide-ink/8">
            {favorites.map((f) => {
              const u = f.siteUser;
              return (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    {u.contactId ? (
                      <Link
                        href={`/kisiler/${u.contactId}`}
                        className="text-sm font-semibold hover:text-brand-700"
                      >
                        {u.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold">{u.name}</p>
                    )}
                    <p className="mt-0.5 truncate text-xs text-ink/50">
                      {favDateFmt.format(f.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    {u.phone && (
                      <a
                        href={`tel:${u.phone}`}
                        className="flex items-center gap-1 text-ink/65 hover:text-brand-700"
                      >
                        <Phone size={12} /> {u.phone}
                      </a>
                    )}
                    <a
                      href={`mailto:${u.email}`}
                      className="flex items-center gap-1 text-ink/65 hover:text-brand-700"
                    >
                      <Mail size={12} /> {u.email}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
        availablePortals={portals}
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
          platforms: listing.platforms ?? [],
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
