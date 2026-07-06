"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const input =
  "w-full rounded-lg border border-ink/20 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/25";

function useSubmit(slug: string) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/ofis/${slug}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Gönderilemedi, lütfen tekrar deneyin.");
      return;
    }
    setDone(true);
  }
  return { busy, done, error, submit };
}

function Success({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-brand-600 bg-brand-50 px-4 py-3">
      <Check size={16} className="mt-0.5 shrink-0 text-brand-700" />
      <p className="text-sm font-medium text-brand-700">{text}</p>
    </div>
  );
}

/* ── İlan detayı: "Bilgi al" ── */
export function InfoForm({
  slug,
  listingId,
  listingTitle,
}: {
  slug: string;
  listingId: string;
  listingTitle: string;
}) {
  const { busy, done, error, submit } = useSubmit(slug);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  if (done)
    return (
      <Success text="Talebiniz danışmana iletildi — en kısa sürede aranacaksınız." />
    );

  return (
    <div className="space-y-2.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
        Sizi arayalım
      </p>
      <input
        className={input}
        placeholder="Adınız Soyadınız"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <input
        className={input}
        type="tel"
        placeholder="Telefonunuz"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <textarea
        className={`${input} min-h-16`}
        placeholder={`Mesajınız (opsiyonel) — örn. "${listingTitle}" için hafta sonu yer görmek isterim`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-hidden
      />
      {error && (
        <p className="rounded-lg bg-[#c13515]/10 px-3.5 py-2 text-sm text-[#c13515]">
          {error}
        </p>
      )}
      <button
        onClick={() =>
          submit({ kind: "listing", listingId, name, phone, message, website })
        }
        disabled={busy || !name || !phone}
        className="btn-selvi w-full rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
      >
        {busy ? "Gönderiliyor…" : "Bilgi almak istiyorum"}
      </button>
    </div>
  );
}

/* ── Landing: "Aradığımı bulamadım" ── */
export function RequestForm({
  slug,
  districts,
  rooms,
}: {
  slug: string;
  districts: string[];
  rooms: string[];
}) {
  const { busy, done, error, submit } = useSubmit(slug);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("SALE");
  const [district, setDistrict] = useState("");
  const [room, setRoom] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  if (done)
    return (
      <Success text="Talebiniz kaydedildi — kriterlerinize uyan ilan portföye girdiğinde sizi arayacağız." />
    );

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <input
        className={input}
        placeholder="Adınız Soyadınız"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <input
        className={input}
        type="tel"
        placeholder="Telefonunuz"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <select
        className={input}
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      >
        <option value="SALE">Satılık arıyorum</option>
        <option value="RENT">Kiralık arıyorum</option>
      </select>
      <select
        className={input}
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
      >
        <option value="">İlçe farketmez</option>
        {districts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        className={input}
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      >
        <option value="">Oda farketmez</option>
        {rooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <input
        className={input}
        type="number"
        min={0}
        placeholder="Bütçe üst sınırı (₺)"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />
      <textarea
        className={`${input} min-h-16 sm:col-span-2`}
        placeholder="Eklemek istedikleriniz (opsiyonel)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-hidden
      />
      {error && (
        <p className="rounded-lg bg-[#c13515]/10 px-3.5 py-2 text-sm text-[#c13515] sm:col-span-2">
          {error}
        </p>
      )}
      <button
        onClick={() =>
          submit({
            kind: "search",
            name,
            phone,
            purpose,
            district,
            rooms: room,
            maxPrice,
            note,
            website,
          })
        }
        disabled={busy || !name || !phone}
        className="btn-selvi rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 sm:col-span-2"
      >
        {busy ? "Gönderiliyor…" : "Talebimi bırak"}
      </button>
    </div>
  );
}
