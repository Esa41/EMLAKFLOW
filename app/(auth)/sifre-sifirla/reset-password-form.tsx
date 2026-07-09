"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo, BrandMark } from "@/components/brand-logo";

export default function ResetPasswordForm() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mismatch = password2.length > 0 && password !== password2;
  const canSubmit =
    !loading && token && password.length >= 8 && password === password2;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "İşlem başarısız.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="glass w-full max-w-md rounded-3xl border border-white/60 p-8 shadow-lg">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark vertical="REAL_ESTATE" />
          <div>
            <BrandLogo vertical="REAL_ESTATE" className="text-xl" />
            <p className="text-xs text-ink/45">Yeni şifre belirle</p>
          </div>
        </div>

        {done ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-ink/75">
              Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <Link
              href="/login"
              className="btn-selvi block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white"
            >
              Giriş yap
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              Bağlantı eksik veya hatalı. Lütfen e-postadaki bağlantıyı
              kullanın ya da yeni bağlantı isteyin.
            </p>
            <Link
              href="/sifremi-unuttum"
              className="block text-center text-sm font-semibold text-brand-600"
            >
              Yeni bağlantı iste
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/65">
                Yeni şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="En az 8 karakter"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/65">
                Yeni şifre (tekrar)
              </label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {mismatch && (
              <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                Şifreler eşleşmiyor.
              </p>
            )}
            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-selvi w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {loading ? "Kaydediliyor…" : "Şifreyi güncelle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
