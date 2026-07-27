/**
 * Deploy sırasında şema senkronu — `vercel.json` buildCommand'inden çağrılır.
 *
 * NEDEN: Bu proje migration kullanmıyor; şema `prisma db push` ile senkronlanıyor
 * (bkz. docs/DEVAM-KILAVUZU.md). Bu komutu elle çalıştırmak, geliştiricinin
 * makinesinde DOĞRU DATABASE_URL'in tanımlı olmasına bağlı — yanlış veritabanına
 * bağlıyken çalıştırmak başka bir projenin verisini riske atar. Vercel'in
 * ortamında doğru bağlantı dizesi zaten tanımlı olduğu için, şemayı deploy
 * anında oradan uygulamak hem daha güvenli hem de "kod ile şema aynı anda
 * yayına girer" garantisini verir (eksik kolon yüzünden 500 alma tuzağı biter).
 *
 * GÜVENLİK KURALLARI
 * 1. Yalnız PRODUCTION deploy'da çalışır. Preview deploy'ları canlı şemayı
 *    değiştirmez — şema tek ve öngörülebilir bir anda değişsin.
 * 2. `--accept-data-loss` GEÇİLMEZ. Yeni kolon eklemek gibi toplayıcı
 *    değişiklikler sessizce uygulanır; veri kaybettirecek bir değişiklik ise
 *    komut HATA verir ve build düşer. Yani en kötü senaryo "deploy olmaz",
 *    "veri silinir" değil.
 * 3. Yerelde hiç çalışmaz — `npm run build` davranışı değişmez.
 */

import { execFileSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.VERCEL_ENV === "production";

if (!isVercel || !isProduction) {
  console.log(
    `[db-sync] Atlandı (VERCEL=${process.env.VERCEL ?? "-"}, VERCEL_ENV=${
      process.env.VERCEL_ENV ?? "-"
    }). Şema yalnız production deploy'unda senkronlanır.`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("[db-sync] DATABASE_URL tanımlı değil — build durduruldu.");
  process.exit(1);
}

console.log("[db-sync] prisma db push başlıyor (veri kaybı kabul EDİLMİYOR)…");
try {
  execFileSync(
    "npx",
    ["prisma", "db", "push", "--skip-generate"],
    { stdio: "inherit" },
  );
  console.log("[db-sync] Şema senkron. ✓");
} catch {
  console.error(
    "\n[db-sync] Şema senkronu BAŞARISIZ — deploy durduruldu.\n" +
      "Muhtemel sebep: değişiklik veri kaybı gerektiriyor (kolon/tablo silinmesi).\n" +
      "Bu durumda schema.prisma'yı gözden geçirin; gerçekten isteniyorsa\n" +
      "değişikliği elle ve kontrollü uygulayın. Kod DEPLOY EDİLMEDİ, canlı\n" +
      "sürüm olduğu gibi çalışmaya devam ediyor.",
  );
  process.exit(1);
}
