"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { SocialPlatform } from "@prisma/client";
import { Clapperboard } from "lucide-react";
import { generateSocialAsset, scheduleAsset } from "@/app/actions/social-os";
import {
  FORMAT_GUIDE,
  TONE_GUIDE,
  CONTENT_PACKS,
  recommendedPacks,
  type FormatKey,
  type ToneKey,
  type ContentPack,
} from "@/lib/social-os/catalog";
import { TEMPLATES, type TemplateKey } from "@/lib/studio-templates";
import type { StudioMediaItem } from "@/lib/social-os/studio-media";

type ListingOpt = {
  id: string;
  refCode: string;
  title: string;
  purpose: string;
  type: string;
  price: number;
};

type AssetRow = {
  id: string;
  headline: string | null;
  caption: string | null;
  cta: string | null;
  format: string;
  tone: string | null;
  status: string;
  hashtags: string[];
  mediaUrls?: string[];
  listing: { refCode: string; title: string } | null;
  postingRec: unknown;
  createdAt: string;
};

const FORMAT_KEYS = Object.keys(FORMAT_GUIDE) as FormatKey[];
const TONE_KEYS = Object.keys(TONE_GUIDE) as ToneKey[];

export function PlannerPanel({
  listings,
  initialAssets,
  studioVideos = [],
  initialListingId,
  initialPackId,
}: {
  listings: ListingOpt[];
  initialAssets: AssetRow[];
  studioVideos?: StudioMediaItem[];
  initialListingId?: string | null;
  initialPackId?: string | null;
}) {
  const bootPack = initialPackId
    ? CONTENT_PACKS.find((p) => p.id === initialPackId)
    : null;

  const [assets, setAssets] = useState(initialAssets);
  const [listingId, setListingId] = useState(
    initialListingId && listings.some((l) => l.id === initialListingId)
      ? initialListingId
      : (listings[0]?.id ?? ""),
  );
  const [format, setFormat] = useState<FormatKey>(
    bootPack?.format ?? "FEED_POST",
  );
  const [tone, setTone] = useState<ToneKey>(bootPack?.tone ?? "professional");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAssets[0]?.id ?? null,
  );
  const [scheduleAt, setScheduleAt] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [activePackId, setActivePackId] = useState<string | null>(
    bootPack?.id ?? "new-listing",
  );
  const [boundVideo, setBoundVideo] = useState<StudioMediaItem | null>(null);

  const listing = useMemo(
    () => listings.find((l) => l.id === listingId) ?? null,
    [listings, listingId],
  );

  const listingVideos = useMemo(
    () => studioVideos.filter((v) => v.listingId === listingId),
    [studioVideos, listingId],
  );

  const packs = useMemo(
    () =>
      recommendedPacks(
        listing
          ? {
              purpose: listing.purpose,
              type: listing.type,
              price: listing.price,
            }
          : null,
        5,
      ),
    [listing],
  );

  const activePack = CONTENT_PACKS.find((p) => p.id === activePackId) ?? null;
  const studioHintKey =
    activePack?.studioTemplateKey ??
    (format === "REEL" ? "fpv_reels" : null);
  const studioHint =
    studioHintKey && studioHintKey in TEMPLATES
      ? TEMPLATES[studioHintKey as TemplateKey]
      : null;

  const formatMeta = FORMAT_GUIDE[format];
  const toneMeta = TONE_GUIDE[tone];

  const selected = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId],
  );

  function applyPack(pack: ContentPack) {
    setActivePackId(pack.id);
    setFormat(pack.format);
    setTone(pack.tone);
  }

  function generate() {
    if (!listingId) return;
    setError(null);
    start(async () => {
      try {
        const res = await generateSocialAsset({
          listingId,
          format,
          tone,
          mediaUrls: boundVideo ? [boundVideo.videoUrl] : undefined,
          studioProjectId:
            boundVideo?.kind === "project" ? boundVideo.id : null,
          studioJobId: boundVideo?.kind === "job" ? boundVideo.id : null,
        });
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
    <div className="space-y-5">
      {/* Hazır paketler */}
      <section className="rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Ne tür içerik?</h2>
            <p className="mt-0.5 text-[13px] text-ink/50">
              Hazır paket seç — format ve ton otomatik ayarlanır. İstersen aşağıdan
              ince ayar yap.
            </p>
          </div>
          {listing && (
            <p className="text-[11px] font-medium text-ink/40">
              Öneri: {listing.purpose === "RENT" ? "Kiralık" : "Satılık"} ·{" "}
              {listing.type}
            </p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {packs.map((pack) => {
            const on = activePackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => applyPack(pack)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  on
                    ? "border-brand-600 bg-brand-600/10"
                    : "border-ink/10 hover:border-brand-600/40 hover:bg-[var(--app-input-bg)]"
                }`}
              >
                {pack.badge && (
                  <span className="mb-1.5 inline-block rounded-full bg-brand-600/15 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                    {pack.badge}
                  </span>
                )}
                <span className="block text-[13px] font-semibold text-ink">
                  {pack.title}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-ink/50">
                  {pack.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-4">
          <label className="block space-y-1">
            <span className="text-[12px] font-semibold text-ink/40">İlan</span>
            <select
              value={listingId}
              onChange={(e) => {
                setListingId(e.target.value);
                setActivePackId(null);
                setBoundVideo(null);
              }}
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

          {(format === "REEL" || studioHint) && (
            <div className="space-y-2 rounded-xl border border-brand-600/20 bg-brand-600/5 p-3">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-brand-600">
                <Clapperboard size={14} />
                AI Stüdyo
              </div>
              {studioHint && (
                <div>
                  <p className="text-[13px] font-semibold text-ink">
                    Önerilen şablon: {studioHint.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink/50">
                    {studioHint.subtitle} — {studioHint.description.slice(0, 120)}
                    {studioHint.description.length > 120 ? "…" : ""}
                  </p>
                  <Link
                    href={`/dashboard/studio`}
                    className="mt-1.5 inline-block text-[12px] font-semibold text-brand-600 hover:underline"
                  >
                    Stüdyoda bu şablonla üret →
                  </Link>
                </div>
              )}
              {listingVideos.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-ink/40">
                    Bu ilanın hazır videoları
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {listingVideos.map((v) => {
                      const on = boundVideo?.id === v.id;
                      return (
                        <button
                          key={`${v.kind}-${v.id}`}
                          type="button"
                          onClick={() =>
                            setBoundVideo(on ? null : v)
                          }
                          className={`w-28 shrink-0 overflow-hidden rounded-lg border text-left ${
                            on
                              ? "border-brand-600 ring-1 ring-brand-600"
                              : "border-ink/10"
                          }`}
                        >
                          <video
                            src={v.videoUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className="aspect-video w-full bg-black object-cover"
                          />
                          <span className="block truncate px-1.5 py-1 text-[10px] text-ink/55">
                            {v.templateLabel || v.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {boundVideo && (
                    <p className="text-[11px] text-brand-600">
                      Video bağlandı — caption bu videoyla üretilecek.
                    </p>
                  )}
                </div>
              ) : (
                format === "REEL" && (
                  <p className="text-[11px] text-ink/45">
                    Bu ilanda henüz Stüdyo videosu yok. Önce Stüdyo’da üret veya
                    yalnızca caption planı oluştur.
                  </p>
                )
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-ink/40">Format</p>
            <div className="grid gap-1.5">
              {FORMAT_KEYS.map((key) => {
                const g = FORMAT_GUIDE[key];
                const on = format === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setFormat(key);
                      setActivePackId(null);
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      on
                        ? "border-brand-600 bg-brand-600/10"
                        : "border-ink/8 hover:bg-[var(--app-input-bg)]"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold">{g.label}</span>
                      <span className="text-[10px] text-ink/35">{g.platforms}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink/50">
                      {g.short} · {g.bestFor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-ink/40">Ton / üslup</p>
            <div className="flex flex-wrap gap-1.5">
              {TONE_KEYS.map((key) => {
                const g = TONE_GUIDE[key];
                const on = tone === key;
                return (
                  <button
                    key={key}
                    type="button"
                    title={`${g.vibe} — ${g.useWhen}`}
                    onClick={() => {
                      setTone(key);
                      setActivePackId(null);
                    }}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                      on
                        ? "bg-brand-600 text-white"
                        : "bg-[var(--app-input-bg)] text-ink/60 hover:text-ink"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl bg-[var(--app-input-bg)] px-3 py-2.5">
              <p className="text-[11px] font-semibold text-ink/45">
                {toneMeta.label} — {toneMeta.vibe}
              </p>
              <p className="mt-1 text-[13px] italic text-ink/70">
                “{toneMeta.sample}”
              </p>
              <p className="mt-1 text-[11px] text-ink/40">
                Ne zaman: {toneMeta.useWhen}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-brand-600/30 bg-brand-600/5 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
              Bu seçim ne üretecek?
            </p>
            <p className="mt-1 text-[13px] font-semibold text-ink">
              {formatMeta.label} × {toneMeta.label}
            </p>
            <p className="mt-0.5 text-[12px] text-ink/55">{formatMeta.produces}</p>
          </div>

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
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {assets.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left text-[13px] ${
                      selectedId === a.id
                        ? "bg-brand-600/15 text-ink"
                        : "text-ink/70 hover:bg-[var(--app-input-bg)]"
                    }`}
                  >
                    <span className="block truncate font-medium">
                      {a.headline || "Başlıksız"}
                    </span>
                    <span className="text-[11px] text-ink/40">
                      {FORMAT_GUIDE[a.format as FormatKey]?.label ?? a.format} ·{" "}
                      {a.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-5">
          {!selected ? (
            <div className="space-y-3 text-sm text-ink/50">
              <p className="font-medium text-ink/70">Nasıl başlanır?</p>
              <ol className="list-decimal space-y-1.5 pl-4">
                <li>Üstten bir hazır paket seç (veya format + tonu elle ayarla)</li>
                <li>İlanı seç</li>
                <li>
                  <strong className="text-ink">İçerik üret</strong> — caption, CTA,
                  hashtag ve görsel/video prompt’ları gelir
                </li>
                <li>Beğenirsen takvime ekle</li>
              </ol>
            </div>
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
              {selected.format === "REEL" && selected.mediaUrls?.[0] && (
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink/40">
                    Bağlı video
                  </p>
                  <video
                    src={selected.mediaUrls[0]}
                    controls
                    className="max-h-64 w-full rounded-xl bg-black"
                  />
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
