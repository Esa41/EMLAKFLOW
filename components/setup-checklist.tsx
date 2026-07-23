"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Check, Copy, ArrowRight, X, Wand2, Rocket } from "lucide-react";

type Props = {
  hasListing: boolean;
  hasIdentity: boolean;
  shareUrl: string;
  showcaseEnabled: boolean;
  suggestedHeadline: string;
  suggestedAbout: string;
};

/**
 * Yeni ofis aktivasyon kartı — vitrini 3 adımda yayına al:
 * 1) İlk ilan  2) Kendini tanıt (AI önerili başlık/hakkımızda)  3) Linki paylaş.
 * Gerçek ilerlemeyi gösterir; tamamlanınca dashboard bir daha göstermez.
 */
export function SetupChecklist({
  hasListing,
  hasIdentity,
  shareUrl,
  showcaseEnabled,
  suggestedHeadline,
  suggestedAbout,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [savedIdentity, setSavedIdentity] = useState(hasIdentity);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("emlakflow_setup_dismissed")) setDismissed(true);
    if (localStorage.getItem("emlakflow_setup_shared")) setShared(true);
  }, []);

  const done = (hasListing ? 1 : 0) + (savedIdentity ? 1 : 0) + (shared ? 1 : 0);
  const pct = Math.round((done / 3) * 100);

  async function saveIdentity() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showcaseHeadline: (headline || suggestedHeadline).slice(0, 90),
          aboutText: about || suggestedAbout,
        }),
      });
      if (res.ok) {
        setSavedIdentity(true);
        setIdentityOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setShared(true);
      localStorage.setItem("emlakflow_setup_shared", "1");
      setTimeout(() => setCopied(false), 1600);
    });
  }

  function dismiss() {
    localStorage.setItem("emlakflow_setup_dismissed", "1");
    setDismissed(true);
  }

  if (!mounted || dismissed) return null;

  const StepDot = ({ ok, n }: { ok: boolean; n: number }) =>
    ok ? (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
        <Check size={15} strokeWidth={3} />
      </span>
    ) : (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-brand-600/30 font-mono text-[12px] font-bold text-brand-700">
        {n}
      </span>
    );

  return (
    <div className="dash-in mb-6 overflow-hidden rounded-2xl border border-brand-600/20 bg-brand-50/60">
      <div className="flex items-start gap-3 p-5 pb-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Rocket size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            {done === 3 ? "Vitrinin yayında! 🎉" : "Vitrinini 3 adımda yayına al"}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink/55">
            {done === 3
              ? "Her şey hazır — linkini paylaşmaya devam et."
              : "Birkaç dakikada kendi web siten hazır, müşterilerine gönder."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold text-brand-700">{done}/3</span>
          <button
            onClick={dismiss}
            aria-label="Kapat"
            className="rounded-full p-1 text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink/60"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ilerleme çubuğu */}
      <div className="mx-5 h-1.5 overflow-hidden rounded-full bg-brand-600/12">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-1 p-3">
        {/* 1 — ilk ilan */}
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
          <StepDot ok={hasListing} n={1} />
          <div className="min-w-0 flex-1">
            <p className={`text-[14px] font-semibold ${hasListing ? "text-ink/45 line-through" : ""}`}>
              İlk ilanını ekle
            </p>
            {!hasListing && (
              <p className="text-[12px] text-ink/50">Eklediğin ilan anında vitrininde görünür.</p>
            )}
          </div>
          {!hasListing && (
            <Link
              href="/portfoy/yeni"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-brand-700"
            >
              <Plus size={14} /> İlan ekle
            </Link>
          )}
        </div>

        {/* 2 — kendini tanıt */}
        <div className="rounded-xl px-2.5 py-2.5">
          <div className="flex items-center gap-3">
            <StepDot ok={savedIdentity} n={2} />
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] font-semibold ${savedIdentity ? "text-ink/45 line-through" : ""}`}>
                Kendini tanıt
              </p>
              {!savedIdentity && (
                <p className="text-[12px] text-ink/50">Vitrin başlığın ve hakkında yazın — AI hazır öneriyor.</p>
              )}
            </div>
            {!savedIdentity && (
              <button
                onClick={() => {
                  setIdentityOpen((o) => !o);
                  if (!headline) setHeadline(suggestedHeadline);
                  if (!about) setAbout(suggestedAbout);
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-600/40 px-3.5 py-2 text-[13px] font-bold text-brand-700 transition-colors hover:bg-brand-600/10"
              >
                {identityOpen ? "Kapat" : "Doldur"}
              </button>
            )}
          </div>

          {identityOpen && !savedIdentity && (
            <div className="ml-10 mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink/45">Vitrin başlığı</label>
                <input
                  value={headline}
                  maxLength={90}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="dash-input w-full rounded-lg"
                  placeholder={suggestedHeadline}
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink/45">Hakkımızda</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={3}
                  className="dash-input w-full rounded-lg"
                  placeholder={suggestedAbout}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setHeadline(suggestedHeadline); setAbout(suggestedAbout); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink/70 hover:border-ink/30"
                >
                  <Wand2 size={13} /> Otomatik doldur
                </button>
                <button
                  onClick={saveIdentity}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3 — paylaş */}
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
          <StepDot ok={shared} n={3} />
          <div className="min-w-0 flex-1">
            <p className={`text-[14px] font-semibold ${shared ? "text-ink/45" : ""}`}>Vitrinini paylaş</p>
            {shareUrl && showcaseEnabled ? (
              <p className="truncate font-mono text-[11px] text-ink/45">{shareUrl.replace(/^https?:\/\//, "")}</p>
            ) : (
              <p className="text-[12px] text-ink/50">Vitrini Ayarlar&apos;dan aç, sonra linkini paylaş.</p>
            )}
          </div>
          {shareUrl && showcaseEnabled && (
            <button
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-600/40 px-3.5 py-2 text-[13px] font-bold text-brand-700 transition-colors hover:bg-brand-600/10"
            >
              {copied ? <><Check size={14} /> Kopyalandı</> : <><Copy size={14} /> Linki kopyala</>}
            </button>
          )}
        </div>
      </div>

      {done === 3 && (
        <div className="flex items-center justify-between gap-3 border-t border-brand-600/15 bg-white/50 px-5 py-3">
          <p className="text-[13px] font-semibold text-brand-700">Tebrikler, vitrinin hazır ve yayında.</p>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-700 hover:underline">
            Vitrini gör <ArrowRight size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
