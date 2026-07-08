"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LogOut, UserRound, X } from "lucide-react";
import { useSiteSession } from "./site-session-context";

/**
 * Vitrin üyelik arayüzü (alıcı/kiracı):
 * - SiteAuthModal: giriş/kayıt sekmeli modal
 * - SiteAuthHeader: vitrin antetindeki üyelik alanı
 * - SiteAuthPrompt: giriş gerektiren sayfalarda çağrı butonu
 */

const inputCls =
  "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40";

export function SiteAuthModal({
  slug,
  open,
  onClose,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { refresh } = useSiteSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ofis/${slug}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { name, email, password, phone },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "İşlem başarısız.");
      onClose();
      await refresh(); // client oturum durumu (antet + kalpler)
      router.refresh(); // server render'lı sayfalar (favorilerim)
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-ink bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            {mode === "login" ? "Üye Girişi" : "Üye Ol"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/[0.05] hover:text-ink"
            aria-label="Kapat"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-xl border border-ink/15 p-1 text-sm font-semibold">
          {(
            [
              ["login", "Giriş Yap"],
              ["register", "Üye Ol"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-lg py-1.5 transition-colors ${
                mode === m ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <input
              className={inputCls}
              placeholder="Ad Soyad *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className={inputCls}
            type="email"
            placeholder="E-posta *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputCls}
            type="password"
            placeholder={mode === "register" ? "Şifre (en az 6 karakter) *" : "Şifre *"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) submit();
            }}
          />
          {mode === "register" && (
            <input
              className={inputCls}
              type="tel"
              placeholder="Telefon (isteğe bağlı)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2 text-xs text-rose-600">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-selvi mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading
            ? "İşleniyor…"
            : mode === "login"
              ? "Giriş Yap"
              : "Üyeliği Oluştur"}
        </button>
        <p className="mt-3 text-center text-[11px] text-ink/45">
          Üyelikle favori ilanlarınızı kaydedebilir, her cihazdan
          erişebilirsiniz.
        </p>
      </div>
    </div>
  );
}

export function SiteAuthHeader({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, refresh } = useSiteSession();
  const [open, setOpen] = useState(false);
  const userName = user?.name ?? null;

  async function logout() {
    await fetch(`/api/ofis/${slug}/auth/logout`, { method: "POST" });
    await refresh();
    router.refresh();
  }

  if (userName) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href={`/ofis/${slug}/favorilerim`}
          className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm font-semibold text-ink/75 hover:border-ink/50"
        >
          <Heart size={14} className="text-rose-500" />
          <span className="hidden sm:inline">Favorilerim</span>
        </Link>
        <button
          onClick={logout}
          title={`${userName} — çıkış yap`}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink/50 hover:text-ink"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm font-semibold text-ink/75 hover:border-ink/50"
      >
        <UserRound size={14} />
        <span className="hidden sm:inline">Giriş / Üye Ol</span>
      </button>
      <SiteAuthModal slug={slug} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function SiteAuthPrompt({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-selvi rounded-xl px-6 py-2.5 text-sm font-bold text-white"
      >
        Giriş Yap / Üye Ol
      </button>
      <SiteAuthModal slug={slug} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
