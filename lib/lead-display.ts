import { PURPOSE_TR, TYPE_TR, trMoney } from "@/lib/labels";
import { formatVehicleKm } from "@/lib/showcase-vertical";

export const LEAD_STATUS_TR: Record<string, string> = {
  OPEN: "Açık",
  MATCHED: "Eşleşti",
  CONVERTED: "Dönüştü",
  LOST: "Kaybedildi",
};

export const LEAD_STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-brand-50 text-brand-700",
  MATCHED: "bg-emerald-50 text-emerald-700",
  CONVERTED: "bg-violet-50 text-violet-700",
  LOST: "bg-slate-100 text-slate-500",
};

type LeadLike = {
  purpose: string;
  type?: string | null;
  status: string;
  source?: string | null;
  city?: string | null;
  district?: string | null;
  rooms?: string | null;
  minArea?: number | null;
  maxArea?: number | null;
  minPrice?: unknown;
  maxPrice?: unknown;
  needsCredit?: boolean;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  minYear?: number | null;
  maxKm?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  note?: string | null;
  createdAt?: Date | string;
};

function money(v: unknown): string | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : trMoney.format(n);
}

/** Talep kartında gösterilecek yapılandırılmış kriter satırları. */
export function leadCriteriaRows(lead: LeadLike, isAuto: boolean): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];

  rows.push({ label: "İşlem", value: PURPOSE_TR[lead.purpose] ?? lead.purpose });
  if (lead.type) rows.push({ label: "Tip", value: TYPE_TR[lead.type] ?? lead.type });

  if (isAuto) {
    if (lead.vehicleBrand) rows.push({ label: "Marka", value: lead.vehicleBrand });
    if (lead.vehicleModel) rows.push({ label: "Model", value: lead.vehicleModel });
    if (lead.minYear) rows.push({ label: "Min yıl", value: String(lead.minYear) });
    if (lead.maxKm != null) rows.push({ label: "Max km", value: formatVehicleKm(lead.maxKm) });
    if (lead.fuel) rows.push({ label: "Yakıt", value: lead.fuel });
    if (lead.transmission) rows.push({ label: "Vites", value: lead.transmission });
  } else {
    const loc = [lead.district, lead.city].filter(Boolean).join(", ");
    if (loc) rows.push({ label: "Bölge", value: loc });
    if (lead.rooms) rows.push({ label: "Oda", value: lead.rooms });
    if (lead.minArea != null) rows.push({ label: "Min m²", value: String(lead.minArea) });
    if (lead.maxArea != null) rows.push({ label: "Max m²", value: String(lead.maxArea) });
    if (lead.needsCredit) rows.push({ label: "Kredi", value: "Şart" });
  }

  const minP = money(lead.minPrice);
  const maxP = money(lead.maxPrice);
  if (minP || maxP) {
    rows.push({
      label: "Bütçe",
      value: minP && maxP ? `${minP} – ${maxP}` : maxP ?? minP ?? "—",
    });
  }

  if (lead.source) rows.push({ label: "Kaynak", value: lead.source });

  return rows;
}

export function leadSummaryLine(lead: LeadLike, isAuto: boolean): string {
  const rows = leadCriteriaRows(lead, isAuto);
  if (lead.note && !lead.note.startsWith("[Vitrin")) return lead.note;
  const main = rows
    .filter((r) => !["Kaynak", "Kredi"].includes(r.label))
    .slice(0, 4)
    .map((r) => r.value)
    .join(" · ");
  return main || "Talep kaydı";
}
