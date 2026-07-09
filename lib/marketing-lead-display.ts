import type { MarketingLeadStatus } from "@prisma/client";

export const MARKETING_LEAD_STATUS_TR: Record<MarketingLeadStatus, string> = {
  PENDING: "Bekliyor",
  SENT: "Gönderildi",
  OPENED: "Açıldı",
  CLICKED: "Tıklandı",
  REJECTED: "Reddedildi",
  DEMO_BOOKED: "Demo alındı",
};

export const MARKETING_LEAD_STATUS_BADGE: Record<MarketingLeadStatus, string> = {
  PENDING: "bg-ink/[0.08] text-ink/60",
  SENT: "bg-blue-50 text-blue-700",
  OPENED: "bg-emerald-50 text-emerald-700",
  CLICKED: "bg-teal-50 text-teal-800",
  REJECTED: "bg-rose-50 text-rose-700",
  DEMO_BOOKED: "bg-violet-50 text-violet-700",
};
