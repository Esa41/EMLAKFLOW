"use client";

import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";

/**
 * Kişi detayındaki "Uygun İlanlar" satırından tek tıkla ofis markalı
 * portföy önerisi maili gönderir (POST /api/mails/new-listing).
 */
export function SendListingMailButton({
  contactId,
  listingId,
  hasEmail,
}: {
  contactId: string;
  listingId: string;
  hasEmail: boolean;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function send() {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const res = await fetch("/api/mails/new-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, listingId }),
      });
      if (!res.ok) throw new Error();
      setState("sent");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  if (!hasEmail) {
    return (
      <span
        title="Kişinin kayıtlı e-postası yok"
        className="cursor-not-allowed rounded-md bg-ink/[0.04] px-3 py-1.5 text-xs font-semibold text-ink/35"
      >
        <Mail size={12} className="mr-1 inline" />
        E-posta yok
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={send}
      disabled={state === "sending" || state === "sent"}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        state === "sent"
          ? "bg-emerald-50 text-emerald-700"
          : state === "error"
            ? "bg-rose-50 text-rose-600"
            : "bg-ink/[0.05] text-ink/70 hover:bg-ink/10"
      }`}
    >
      {state === "sending" ? (
        <>
          <Loader2 size={12} className="mr-1 inline animate-spin" /> Gönderiliyor
        </>
      ) : state === "sent" ? (
        <>
          <Check size={12} className="mr-1 inline" /> Gönderildi
        </>
      ) : state === "error" ? (
        "Gönderilemedi"
      ) : (
        <>
          <Mail size={12} className="mr-1 inline" /> Mail gönder
        </>
      )}
    </button>
  );
}
