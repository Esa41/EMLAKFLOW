export const PURPOSE_TR: Record<string, string> = {
  SALE: "Satılık",
  RENT: "Kiralık",
};

export const TYPE_TR: Record<string, string> = {
  APARTMENT: "Daire",
  HOUSE: "Müstakil Ev",
  VILLA: "Villa",
  LAND: "Arsa",
  COMMERCIAL: "Dükkan / Ticari",
  OFFICE: "Ofis",
};

export const STATUS_TR: Record<string, string> = {
  DRAFT: "Taslak",
  ACTIVE: "Yayında",
  PASSIVE: "Pasif",
  SOLD: "Satıldı",
  RENTED: "Kiralandı",
};

export const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PASSIVE: "bg-amber-50 text-amber-700",
  SOLD: "bg-brand-50 text-brand-700",
  RENTED: "bg-violet-50 text-violet-700",
};

export const ROOM_OPTIONS = [
  "1+0",
  "1+1",
  "2+1",
  "3+1",
  "3.5+1",
  "4+1",
  "4+2",
  "5+1",
  "5+2",
  "6+",
];

export const CONTRACT_TYPE_TR: Record<string, string> = {
  AUTHORIZATION: "Yetki Belgesi",
  VIEWING_FORM: "Yer Gösterme Formu",
  SALE_CONTRACT: "Satış Sözleşmesi",
  RENT_CONTRACT: "Kira Sözleşmesi",
};

export const trMoney = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export const STAGE_TR: Record<string, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişimde",
  VIEWING: "Yer Gösterildi",
  OFFER: "Teklif",
  CONTRACT: "Sözleşme",
  CLOSED_WON: "Kazanıldı",
  CLOSED_LOST: "Kaybedildi",
};

/* Parsel renk rampası — sözleşmeye yaklaştıkça koyulaşır, kazanılan bakır */
export const STAGE_COLOR: Record<string, string> = {
  NEW: "#c7d6c2",
  CONTACTED: "#c7d6c2",
  VIEWING: "#8fb392",
  OFFER: "#4e8362",
  CONTRACT: "#1e5b3e",
  CLOSED_WON: "#b4652a",
  CLOSED_LOST: "#c8beb4",
};
