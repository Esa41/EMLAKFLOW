/** Lead create/update body → Prisma alan eşlemesi. */

import type { LeadStatus, ListingPurpose, ListingType } from "@prisma/client";

const PURPOSES: ListingPurpose[] = ["SALE", "RENT"];
const STATUSES: LeadStatus[] = ["OPEN", "MATCHED", "CONVERTED", "LOST"];

function num(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === "" || v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function str(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === "" || v == null) return null;
  return String(v).trim();
}

export function leadDataFromBody(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (body.purpose !== undefined && PURPOSES.includes(body.purpose as ListingPurpose)) {
    data.purpose = body.purpose;
  }
  if (body.type !== undefined) {
    data.type = body.type ? (body.type as ListingType) : null;
  }
  if (body.status !== undefined && STATUSES.includes(body.status as LeadStatus)) {
    data.status = body.status;
  }
  if (body.source !== undefined) data.source = str(body.source);
  if (body.note !== undefined) data.note = str(body.note);
  if (body.city !== undefined) data.city = str(body.city);
  if (body.district !== undefined) data.district = str(body.district);
  if (body.rooms !== undefined) data.rooms = str(body.rooms);
  if (body.minArea !== undefined) data.minArea = num(body.minArea);
  if (body.maxArea !== undefined) data.maxArea = num(body.maxArea);
  if (body.minPrice !== undefined) data.minPrice = num(body.minPrice);
  if (body.maxPrice !== undefined) data.maxPrice = num(body.maxPrice);
  if (body.needsCredit !== undefined) data.needsCredit = !!body.needsCredit;
  if (body.vehicleBrand !== undefined) data.vehicleBrand = str(body.vehicleBrand);
  if (body.vehicleModel !== undefined) data.vehicleModel = str(body.vehicleModel);
  if (body.minYear !== undefined) data.minYear = num(body.minYear);
  if (body.maxKm !== undefined) data.maxKm = num(body.maxKm);
  if (body.fuel !== undefined) data.fuel = str(body.fuel);
  if (body.transmission !== undefined) data.transmission = str(body.transmission);

  return data;
}

export function leadCreateDefaults(
  body: Record<string, unknown>,
  defaults: { city?: string | null },
) {
  const purpose =
    body.purpose === "RENT" || body.purpose === "SALE" ? body.purpose : "SALE";
  return {
    purpose: purpose as ListingPurpose,
    city: str(body.city) ?? defaults.city ?? null,
    source: str(body.source) ?? "panel",
    status: "OPEN" as LeadStatus,
    ...leadDataFromBody(body),
  };
}
