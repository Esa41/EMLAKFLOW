"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand-logo";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "İşlem başarısız.");
      setSent(true);
      if (data.devLink) setDevLink(data.devLink); // yalnız lokal geliştirmede gelir
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
            <p className="text-xs text-ink/45">Şifre sıfırlama</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-ink/75">
              Bu e-posta sistemde kayıtlıysa şifre sıfırlama bağlantısı
              gönderildi. Gelen kutunuzu (ve spam klasörünü) kontrol edin —
              bağlantı <strong>30 dakika</strong> geçerlidir.
            </p>
            {devLink && (
              <a
                href={devLink}
                className="block break-all rounded-xl border border-dashed border-ink/25 px-4 py-3 font-mono text-[11px] text-ink/60"
              >
                [DEV] {devLink}
              </a>
            )}
            <Link
              href="/login"
              className="block text-center text-sm font-semibold text-brand-600"
            >
              Girişe dön
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-ink/60">
              Hesabınızın e-posta adresini girin; size yeni şifre belirleme
              bağlantısı gönderelim.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/65">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email && handleSubmit()}
                className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="ornek@ofis.com"
                autoComplete="email"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="btn-selvi w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
            </button>

            <p className="text-center text-sm text-ink/55">
              Şifrenizi hatırladınız mı?{" "}
              <Link href="/login" className="font-semibold text-brand-600">
                Giriş yapın
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
