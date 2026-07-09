import Link from "next/link";
import { WifiOff } from "lucide-react";

/** Service worker offline fallback — ağ yokken gösterilir. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
        <WifiOff size={28} />
      </div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
        Çevrimdışısınız
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink/55">
        İnternet bağlantısı yok. Bağlantı geldiğinde EmlakFlow paneline
        dönebilirsiniz.
      </p>
      <Link
        href="/dashboard"
        className="btn-selvi mt-6 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
      >
        Panele dön
      </Link>
    </div>
  );
}
