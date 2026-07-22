"use client";

import { useMemo, useState, useTransition } from "react";
import type { SocialPlatform } from "@prisma/client";
import { generateSocialAsset, scheduleAsset } from "@/app/actions/social-os";
import { FORMAT_OPTIONS, TONE_OPTIONS } from "@/lib/social-os/prompts";

type ListingOpt = { id: string; refCode: string; title: string };
type AssetRow = {
  id: string;
  headline: string | null;
  caption: string | null;
  cta: string | null;
  format: string;
  tone: string | null;
  status: string;
  hashtags: string[];
  listing: { refCode: string; title: string } | null;
  postingRec: unknown;
  createdAt: string;
};

export function PlannerPanel({
  listings,
  initialAssets,
}: {
  listings: ListingOpt[];
  initialAssets: AssetRow[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [format, setFormat] = useState("FEED_POST");
  const [tone, setTone] = useState("professional");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAssets[0]?.id ?? null,
  );
  const [scheduleAt, setScheduleAt] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");

  const selected = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId],
  );

  function generate() {
    if (!listingId) return;
    setError(null);
    start(async () => {
      try {
        const res = await generateSocialAsset({ listingId, format, tone });
        // Soft refresh: reload page data via router would be better; append stub
        window.location.href = `/sosyal/planlayici?focus=${res.assetId}`;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Üretim başarısız");
      }
    });
  }

  function schedule() {
    if (!selected || !scheduleAt) return;
    setError(null);
    start(async () => {
      try {
        await scheduleAsset({
          assetId: selected.id,
          platform: platform as SocialPlatform,
          scheduledAt: new Date(scheduleAt).toISOString(),
        });
        setAssets((prev) =>
          prev.map((a) =>
            a.id === selected.id ? { ...a, status: "SCHEDULED" } : a,
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Zamanlama başarısız");
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-4 rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-4">
        <h2 className="text-sm font-bold">AI ile üret</h2>
        <label className="block space-y-1">
          <span className="text-[12px] font-semibold text-ink/40">İlan</span>
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-[var(--app-input-bg)] px-3 py-2 text-sm"
          >
            {listings.length === 0 && (
              <option value="">Aktif ilan yok</option>
            )}
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.refCode} — {l.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[12px] font-semibold text-ink/40">Format</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-[var(--app-input-bg)] px-3 py-2 text-sm"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[12px] font-semibold text-ink/40">Ton</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-[var(--app-input-bg)] px-3 py-2 text-sm"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending || !listingId}
          onClick={generate}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Üretiliyor…" : "İçerik üret"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="border-t border-ink/10 pt-3">
          <p className="mb-2 text-[12px] font-semibold text-ink/40">Taslaklar</p>
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {assets.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`w-full rounded-lg px-2.5 py-2 text-left text-[13px] ${
                    selectedId === a.id
                      ? "bg-brand-600/15 text-ink"
                      : "hover:bg-[var(--app-input-bg)] text-ink/70"
                  }`}
                >
                  <span className="block truncate font-medium">
                    {a.headline || "Başlıksız"}
                  </span>
                  <span className="text-[11px] text-ink/40">
                    {a.format} · {a.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-5">
        {!selected ? (
          <p className="text-sm text-ink/45">
            Üretilen içerik burada görünecek.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink/40">
                Başlık
              </p>
              <h3 className="mt-1 font-display text-xl font-bold">
                {selected.headline}
              </h3>
              {selected.listing && (
                <p className="mt-1 text-[12px] text-ink/45">
                  {selected.listing.refCode} · {selected.listing.title}
                </p>
              )}
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink/40">
                Caption
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                {selected.caption}
              </p>
            </div>
            {selected.cta && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink/40">
                  CTA
                </p>
                <p className="mt-1 text-sm font-medium text-brand-600">
                  {selected.cta}
                </p>
              </div>
            )}
            {selected.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.hashtags.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-[var(--app-input-bg)] px-2 py-0.5 text-[11px] text-ink/55"
                  >
                    {h.startsWith("#") ? h : `#${h}`}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-ink/10 pt-4">
              <p className="mb-2 text-sm font-bold">Takvime ekle</p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] text-ink/40">Platform</span>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="block rounded-xl border border-ink/10 bg-[var(--app-input-bg)] px-3 py-2 text-sm"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="GOOGLE_BUSINESS">Google İşletme</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-ink/40">Tarih / saat</span>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="block rounded-xl border border-ink/10 bg-[var(--app-input-bg)] px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  disabled={pending || !scheduleAt}
                  onClick={schedule}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-ink"
                >
                  Zamanla
                </button>
              </div>
              <p className="mt-2 text-[11px] text-ink/40">
                MVP: kuyruğa alır. Meta otomatik yayın bir sonraki sprintte.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
