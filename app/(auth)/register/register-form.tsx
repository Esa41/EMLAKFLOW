"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getVertical,
  verticalFromParam,
  PRODUCT_CHOICES,
} from "@/lib/verticals";
import { BrandLogo } from "@/components/brand-logo";

export default function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const verticalKey = verticalFromParam(sp.get("v"));
  const v = getVertical(verticalKey);

  const [form, setForm] = useState({
    officeName: "",
    city: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, vertical: verticalKey }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kayıt tamamlanamadı. Bilgileri kontrol edin.");
      setLoading(false);
      return;
    }
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    router.push("/dashboard");
    router.refresh();
  }

  const fields: Array<{
    key: keyof typeof form;
    label: string;
    type?: string;
    placeholder: string;
  }> = [
    {
      key: "officeName",
      label: v.officeNameLabel,
      placeholder: v.officeNamePlaceholder,
    },
    { key: "city", label: "Şehir", placeholder: "Örn. Ankara" },
    { key: "name", label: "Ad Soyad", placeholder: "Adınız Soyadınız" },
    { key: "email", label: "E-posta", type: "email", placeholder: "ornek@ofis.com" },
    {
      key: "password",
      label: "Şifre (en az 8 karakter)",
      type: "password",
      placeholder: "••••••••",
    },
  ];

  const valid =
    form.officeName && form.name && form.email && form.password.length >= 8;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="glass w-full max-w-md rounded-3xl border border-white/60 p-8 shadow-lg">
        <BrandLogo vertical={verticalKey} className="text-xl" />
        <p className="mb-1 mt-3 text-sm text-ink/55">{v.tagline}</p>
        <p className="mb-6 text-xs text-ink/40">
          Farklı ürün mü?{" "}
          <Link href="/platform" className="font-semibold text-brand-600">
            Platform seçimi
          </Link>
        </p>

        <div className="mb-4 flex gap-2">
          {PRODUCT_CHOICES.map(({ key, param, config }) => (
            <Link
              key={key}
              href={`/register?v=${param}`}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-xs font-semibold ${
                key === verticalKey
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-ink/15 text-ink/50 hover:border-ink/30"
              }`}
            >
              {config.productName}
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-ink/65">
                {f.label}
              </label>
              <input
                type={f.type ?? "text"}
                value={form[f.key]}
                onChange={set(f.key)}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          ))}

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !valid}
            className="btn-selvi w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? "Oluşturuluyor…" : `${v.productName} hesabı oluştur`}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-ink/55">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-semibold text-brand-600">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
