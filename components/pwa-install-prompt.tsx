"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "emlakflow_pwa_dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Chrome/Firefox/Edge on iOS also contain Safari — exclude them
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);
}

/**
 * PWA kurulum istemi:
 * - Android/Chrome: beforeinstallprompt → native install
 * - iOS Safari: Paylaş → Ana Ekrana Ekle rehberi
 * - Zaten standalone ise gizlenir
 */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    if (isIos() && isSafari()) {
      setShowIos(true);
      setVisible(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDeferred(null);
    setShowIos(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (outcome === "accepted") {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [deferred]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:p-0">
      <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-2xl shadow-ink/15">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-md">
            <Download size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold text-ink">
              Uygulamayı yükle
            </p>
            {showIos ? (
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                Safari&apos;de{" "}
                <span className="inline-flex items-center gap-0.5 font-semibold text-ink">
                  <Share size={12} className="inline" /> Paylaş
                </span>{" "}
                → <strong>Ana Ekrana Ekle</strong> ile uygulama gibi kullanın.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                Ana ekrana ekleyin — tam ekran, hızlı erişim, adres çubuğu yok.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1 text-ink/35 hover:bg-ink/[0.05] hover:text-ink/60"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        {!showIos && deferred && (
          <button
            type="button"
            onClick={() => void install()}
            className="btn-selvi mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white"
          >
            Uygulamayı Yükle
          </button>
        )}

        {showIos && (
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full rounded-xl border border-ink/15 py-2 text-xs font-bold text-ink/60 hover:bg-ink/[0.03]"
          >
            Anladım
          </button>
        )}
      </div>
    </div>
  );
}
