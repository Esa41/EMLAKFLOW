"use client";

import { useEffect } from "react";

// Vitrin funnel ölçümü. Oturum bazlı tekilleştirme sessionStorage ile yapılır;
// gönderim sendBeacon (sayfa kapanırken bile ulaşır), yoksa keepalive fetch.

function vid(): string {
  let v = sessionStorage.getItem("emlakflow_vid");
  if (!v) {
    v = "v_" + Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem("emlakflow_vid", v);
  }
  return v;
}

function send(tenantId: string, type: string, listingId?: string | null) {
  const payload = JSON.stringify({ t: tenantId, l: listingId ?? undefined, e: type, s: vid() });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/e", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/e", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  }
}

// Oturum başına (olay+ilan) bir kez gönder.
function sendOnce(tenantId: string, type: string, listingId?: string | null) {
  const key = `ef_${type}_${listingId ?? "t"}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  send(tenantId, type, listingId);
}

/**
 * İlan detay sayfasına konur: VIEW kaydı atar ve sayfadaki
 * [data-track="CLICK"] elemanlarına (tel / WhatsApp) tıklamayı dinler.
 */
export function TrackListingView({ tenantId, listingId }: { tenantId: string; listingId: string }) {
  useEffect(() => {
    sendOnce(tenantId, "VIEW", listingId);

    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement).closest?.("[data-track='CLICK']");
      if (el) send(tenantId, "CLICK", listingId);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [tenantId, listingId]);

  return null;
}

/**
 * Vitrin liste sayfasına konur: [data-imp="<listingId>"] kartları
 * IntersectionObserver ile izler, görünür olunca IMPRESSION atar
 * (oturum başına ilan başına 1 kez).
 */
export function TrackImpressions({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-imp]");
    if (cards.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.imp;
          if (id) sendOnce(tenantId, "IMPRESSION", id);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [tenantId]);

  return null;
}
