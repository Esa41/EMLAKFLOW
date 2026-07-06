import Link from "next/link";
import { PRODUCT_CHOICES } from "@/lib/verticals";
import { ProductCard } from "@/components/brand-logo";

export default function PlatformPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper p-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
            Flow Platform
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            İşinize uygun ürünü seçin
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink/55">
            Aynı güçlü altyapı — emlak ofisi veya oto galerisi için ayrı
            deneyim.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PRODUCT_CHOICES.map(({ config, param }) => (
            <ProductCard
              key={config.key}
              config={config}
              href={`/register?v=${param}`}
            />
          ))}
        </div>

        <p className="text-sm text-ink/50">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-semibold text-brand-600">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
