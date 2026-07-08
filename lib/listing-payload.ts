/** Listing create/update body → Prisma alan eşlemesi (emlak + araç). */

import type { ListingPurpose, ListingType, ListingStatus, Prisma } from "@prisma/client";

export function listingDataFromBody(body: Record<string, unknown>) {
  const num = (v: unknown) => (v === "" || v == null ? null : Number(v));
  const str = (v: unknown) => (v === "" || v == null ? null : String(v));

  return {
    ...(body.title !== undefined && { title: String(body.title) }),
    ...(body.purpose !== undefined && { purpose: body.purpose as ListingPurpose }),
    ...(body.type !== undefined && { type: body.type as ListingType }),
    ...(body.status !== undefined && { status: body.status as ListingStatus }),
    ...(body.price !== undefined && { price: body.price as Prisma.Decimal | number | string }),
    ...(body.city !== undefined && { city: body.city as string }),
    ...(body.district !== undefined && { district: body.district as string }),
    ...(body.neighborhood !== undefined && { neighborhood: str(body.neighborhood) }),
    ...(body.address !== undefined && { address: str(body.address) }),
    ...(body.lat !== undefined && { lat: num(body.lat) }),
    ...(body.lng !== undefined && { lng: num(body.lng) }),
    ...(body.rooms !== undefined && { rooms: str(body.rooms) }),
    ...(body.grossArea !== undefined && { grossArea: num(body.grossArea) }),
    ...(body.netArea !== undefined && { netArea: num(body.netArea) }),
    ...(body.floor !== undefined && { floor: num(body.floor) }),
    ...(body.totalFloors !== undefined && { totalFloors: num(body.totalFloors) }),
    ...(body.buildingAge !== undefined && { buildingAge: num(body.buildingAge) }),
    ...(body.heating !== undefined && { heating: str(body.heating) }),
    ...(body.dues !== undefined && { dues: num(body.dues) }),
    ...(body.deedStatus !== undefined && { deedStatus: str(body.deedStatus) }),
    ...(body.creditEligible !== undefined && { creditEligible: !!body.creditEligible }),
    ...(body.furnished !== undefined && { furnished: !!body.furnished }),
    ...(body.inSite !== undefined && { inSite: !!body.inSite }),
    ...(body.description !== undefined && { description: str(body.description) }),
    ...(body.features !== undefined && {
      features: Array.isArray(body.features) ? body.features : [],
    }),
    ...(body.seoTitle !== undefined && { seoTitle: str(body.seoTitle) }),
    ...(body.seoDescription !== undefined && { seoDescription: str(body.seoDescription) }),
    ...(body.parcelGeo !== undefined && {
      parcelGeo: (body.parcelGeo ?? null) as Prisma.InputJsonValue,
    }),
    ...(body.feedEnabled !== undefined && { feedEnabled: !!body.feedEnabled }),
    // Araç
    ...(body.vehicleBrand !== undefined && { vehicleBrand: str(body.vehicleBrand) }),
    ...(body.vehicleModel !== undefined && { vehicleModel: str(body.vehicleModel) }),
    ...(body.vehicleYear !== undefined && { vehicleYear: num(body.vehicleYear) }),
    ...(body.vehicleKm !== undefined && { vehicleKm: num(body.vehicleKm) }),
    ...(body.fuel !== undefined && { fuel: str(body.fuel) }),
    ...(body.transmission !== undefined && { transmission: str(body.transmission) }),
    ...(body.engineSize !== undefined && { engineSize: str(body.engineSize) }),
    ...(body.enginePower !== undefined && { enginePower: num(body.enginePower) }),
    ...(body.color !== undefined && { color: str(body.color) }),
    ...(body.bodyType !== undefined && { bodyType: str(body.bodyType) }),
    ...(body.tramerAmount !== undefined && { tramerAmount: num(body.tramerAmount) }),
    ...(body.plateNumber !== undefined && { plateNumber: str(body.plateNumber) }),
    ...(body.exchangeOk !== undefined && { exchangeOk: !!body.exchangeOk }),
    ...(body.warrantyOk !== undefined && { warrantyOk: !!body.warrantyOk }),
    ...(body.rentDailyPrice !== undefined && { rentDailyPrice: num(body.rentDailyPrice) }),
    ...(body.rentWeeklyPrice !== undefined && { rentWeeklyPrice: num(body.rentWeeklyPrice) }),
    ...(body.rentDeposit !== undefined && { rentDeposit: num(body.rentDeposit) }),
  };
}
