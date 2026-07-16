"use client";

import { useState } from "react";
import {
  Sparkles,
  ImageIcon,
  Film,
  Search,
  ChevronDown,
  Camera,
  Video,
} from "lucide-react";
import { StudioPhotoTab } from "./studio-photo-tab";
import { StudioVideoTab } from "./studio-video-tab";
import type { StudioListing, StudioCredits, StudioJobItem } from "@/app/actions/studio";

type Props = {
  listings: StudioListing[];
  credits: StudioCredits;
  history: StudioJobItem[];
  /** Şablon örnek klipleri — templateKey → imzalı R2 URL */
  templatePreviews: Record<string, string>;
};

export function StudioWorkspace({ listings, credits, history, templatePreviews }: Props) {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo");
  const [imageCredits, setImageCredits] = useState(credits.imageCredits);
  const [videoCredits, setVideoCredits] = useState(credits.videoCredits);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedListing = listings.find((l) => l.id === selectedListingId);
  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.refCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const listingHistory = selectedListingId
    ? history.filter((h) => h.listing?.refCode === selectedListing?.refCode)
    : history;

  return (
    <div className="dash-shell mx-auto max-w-[1200px] space-y-6">
      {/* ── Üst Bilgi Çubuğu — Krediler ── */}
      <div className="dash-in grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Başlık */}
        <div className="flex items-center gap-3 sm:col-span-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">
              AI Stüdyo
            </h1>
            <p className="text-xs text-ink/45">
              {credits.plan === "premium"
                ? "Premium"
                : credits.plan === "pro"
                  ? "Pro"
                  : "Başlangıç"}{" "}
              Plan
            </p>
          </div>
        </div>

        {/* Kredi kartları */}
        <div className="studio-credit-badge dash-card flex items-center gap-4 px-5 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <Camera size={17} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink/40">
              Fotoğraf
            </p>
            <p className="font-display text-[22px] font-bold leading-none tracking-tight tabular-nums">
              {credits.unlimited ? "∞" : imageCredits}
              <span className="ml-1 text-[12px] font-medium text-ink/35">
                {credits.unlimited ? "test modu" : "kredi"}
              </span>
            </p>
          </div>
        </div>

        <div className="studio-credit-badge dash-card flex items-center gap-4 px-5 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
            <Video size={17} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink/40">
              Video
            </p>
            <p className="font-display text-[22px] font-bold leading-none tracking-tight tabular-nums">
              {credits.unlimited ? "∞" : videoCredits}
              <span className="ml-1 text-[12px] font-medium text-ink/35">
                {credits.unlimited ? "test modu" : "kredi"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── İlan Seçici ── */}
      <div className="dash-in" style={{ animationDelay: "100ms" }}>
        <div className="dash-card p-5">
          <label className="mb-2 block text-sm font-semibold text-ink/70">
            Çalışmak istediğiniz ilanı seçin
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-4 py-3 text-left transition-all hover:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            >
              {selectedListing ? (
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-700">
                    {selectedListing.refCode}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedListing.title}
                  </span>
                  <span className="text-xs text-ink/40">
                    {selectedListing.city} / {selectedListing.district}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-ink/40">
                  İlan seçmek için tıklayın...
                </span>
              )}
              <ChevronDown
                size={16}
                className={`shrink-0 text-ink/40 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 z-40 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl">
                <div className="border-b border-[var(--app-border)] p-3">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-ink/35"
                    />
                    <input
                      type="text"
                      placeholder="İlan, künye veya şehir ara…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="dash-input pl-9"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {filteredListings.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-ink/40">
                      Eşleşen ilan bulunamadı.
                    </p>
                  ) : (
                    filteredListings.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setSelectedListingId(l.id);
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--app-input-bg)] ${
                          selectedListingId === l.id ? "bg-brand-50/50" : ""
                        }`}
                      >
                        <span className="rounded-md bg-ink/[0.05] px-2 py-0.5 font-mono text-[10px] font-semibold text-ink/55">
                          {l.refCode}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {l.title}
                          </p>
                          <p className="text-[11px] text-ink/40">
                            {l.city} / {l.district} ·{" "}
                            {l.media.filter((m) => m.kind === "photo").length}{" "}
                            fotoğraf
                          </p>
                        </div>
                        {selectedListingId === l.id && (
                          <span className="text-brand-600">
                            <Sparkles size={14} />
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Çalışma Alanı — Tab'lar ── */}
      {selectedListing && (
        <div
          className="dash-in space-y-5"
          style={{ animationDelay: "150ms" }}
        >
          {/* Tab bar */}
          <div className="flex items-center gap-2">
            <div className="dash-segmented">
              <button
                onClick={() => setActiveTab("photo")}
                className={`dash-segmented-btn flex items-center gap-1.5 ${
                  activeTab === "photo" ? "dash-segmented-btn-active" : ""
                }`}
              >
                <ImageIcon size={14} />
                Fotoğraf Stüdyosu
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`dash-segmented-btn flex items-center gap-1.5 ${
                  activeTab === "video" ? "dash-segmented-btn-active" : ""
                }`}
              >
                <Film size={14} />
                Video Stüdyosu
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2 text-xs text-ink/45">
              <span className="rounded-md bg-ink/[0.04] px-2 py-1 font-mono font-semibold">
                {selectedListing.refCode}
              </span>
              {selectedListing.media.filter((m) => m.kind === "photo").length}{" "}
              fotoğraf
            </div>
          </div>

          {/* Tab içerikleri */}
          {activeTab === "photo" ? (
            <StudioPhotoTab
              unlimited={credits.unlimited}
              listingId={selectedListing.id}
              media={selectedListing.media}
              imageCredits={imageCredits}
              onCreditsChange={setImageCredits}
            />
          ) : (
            <StudioVideoTab
              unlimited={credits.unlimited}
              listingId={selectedListing.id}
              listingType={selectedListing.type}
              media={selectedListing.media}
              videoCredits={videoCredits}
              onCreditsChange={setVideoCredits}
              history={listingHistory}
              templatePreviews={templatePreviews}
            />
          )}
        </div>
      )}

      {/* Henüz ilan seçilmedi */}
      {!selectedListing && (
        <div
          className="dash-in dash-empty flex flex-col items-center gap-3 py-16"
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 text-brand-600">
            <Sparkles size={28} />
          </div>
          <p className="text-[15px] font-semibold text-ink/55">
            Başlamak için bir ilan seçin
          </p>
          <p className="max-w-sm text-center text-xs text-ink/40">
            İlanınızı seçtikten sonra fotoğraflarını AI ile iyileştirebilir veya
            video oluşturabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
