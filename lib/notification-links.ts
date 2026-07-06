/** Bildirim href'leri — tek kaynak; tüm notification.create çağrıları buradan alır. */

export const notificationLinks = {
  listing: (listingId: string) => `/portfoy/${listingId}`,
  contact: (contactId: string) => `/kisiler/${contactId}`,
  deal: (dealId: string) => `/musteriler?deal=${dealId}`,
  appointment: (opts: { date: string; id?: string }) => {
    const p = new URLSearchParams({ date: opts.date });
    if (opts.id) p.set("id", opts.id);
    return `/ajanda?${p.toString()}`;
  },
  finansContracts: (contractId?: string) =>
    contractId ? `/finans?tab=contracts&contract=${contractId}` : `/finans?tab=contracts`,
  finans: () => `/finans`,
  chat: (sessionId?: string) =>
    sessionId ? `/sohbet?session=${encodeURIComponent(sessionId)}` : `/sohbet`,
  team: () => `/ekip`,
  rentals: (agreementId?: string) =>
    agreementId ? `/kiralar?agreement=${agreementId}` : `/kiralar`,
  merkez: () => `/merkez`,
  settings: () => `/ayarlar`,
};

/** ISO tarihten YYYY-MM-DD */
export function dateParam(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
}
