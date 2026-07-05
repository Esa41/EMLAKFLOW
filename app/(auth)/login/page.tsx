"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("E-posta veya şifre hatalı.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="glass w-full max-w-md rounded-3xl border border-white/60 p-8 shadow-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="btn-selvi flex h-11 w-11 items-center justify-center rounded-xl text-xl font-extrabold text-white">
            E
          </div>
          <div>
            <p className="font-display text-xl font-extrabold tracking-tight">
              EmlakFlow
            </p>
            <p className="text-xs text-ink/45">Ofisinizin işletim sistemi</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/65">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="ornek@ofis.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/65">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="btn-selvi w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-ink/55">
          Ofisiniz henüz kayıtlı değil mi?{" "}
          <Link href="/register" className="font-semibold text-brand-600">
            Ofis aç
          </Link>
        </p>
      </div>
    </div>
  );
}
