# EmlakFlow — Proje Durumu & Devam Kılavuzu (Handoff)

> **Son güncelleme: 1 Ağustos 2026** · HEAD `d18710f` (28 Tem 2026)
>
> Bu doküman, projeye yeni oturan bir asistanın/geliştiricinin **kaldığı yerden
> devam etmesi** için yazıldı. Kısa oku, sonra ilgili dosyalara git.
> Tek gerçek kaynaklar: `lib/plans-config.ts` (fiyat/limit),
> `lib/verticals.ts` (dikey/etiket), `components/nav-items.ts` (panel menüsü),
> `lib/showcase-themes.ts` (vitrin temaları), `prisma/schema.prisma` (veri modeli).

---

## 1. Proje ne, canlı durum

**EmlakFlow** — emlak ofisleri için **ücretsiz web sitesi (vitrin) + CRM + AI
Stüdyo** sunan çok kiracılı (multi-tenant) Next.js SaaS. Dikey-farkında:
`REAL_ESTATE` / `AUTO_DEALER` (GaleriFlow) / `MULTI`.

- **Canlı:** https://emlakflow.app — Vercel. **`main`'e push = otomatik prod deploy.**
  (`vercel --prod` GEREKMEZ; çift deploy olur.)
- **Stack:** Next.js 15 (App Router) · React 19 · Tailwind v4 · Prisma 6 + Neon
  Postgres · next-auth v5 · R2 (medya) · Mapbox/Leaflet · AI SDK (OpenAI) ·
  Shotstack + Fal/Kling + Vertex Veo (video) · Resend (mail) · QStash · next-pwa.
- **DB:** Neon `neondb`. Migration YOK; şema `prisma db push` ile senkronlanır —
  **artık deploy sırasında otomatik** (bkz. §6).
- **Git:** `main` = prod. Aktif dal: `claude/remote-control-e4hyjt` (şu an `main`
  ile aynı commit'te — ayrık iş yok).

**Panel menüsü (14 bölüm):** Bugün · Portföy · Satış Hattı · Müşteriler ·
Kira Takibi · Sosyal OS · AI Stüdyo · Analitik · Bildirimler & Faaliyet ·
Vitrin Sohbet · Ajanda · Kasa · Ekip · Ayarlar.
Ayrıca süper-admin paneli (`/admin`), blog (`/blog`), public vitrin (`/ofis/[slug]`).

---

## 2. Son oturumda ne yapıldı (27–28 Tem 2026)

### A) Vitrin tema sistemi — Faz 2 tamam (`ae254b4` → `c40b738` → `d18710f`)
Plan: `docs/vitrin-evrensel-tasarim-plani.md`. Faz 1 (boşluğa dayanıklı taban,
`126fe85`) ve Faz 2 (tema sistemi) **ikisi de bitti**.

- **4 tema** (`lib/showcase-themes.ts`): Klasik (ücretsiz) · Editoryal · Galeri ·
  Minimal. Son üçü `isPremium(tenant.plan)` ile kilitli; Ayarlar > Vitrin'de
  kilitli görünür (yükseltme kancası). Alan: `Tenant.showcaseTheme`.
- **Kritik düzeltme (`c40b738`):** temalar önce hiçbir şeyi değiştirmiyordu —
  `--sc-*` değişkenleri `globals.css`'te tanımlıydı ama onları okuyan `sc-*`
  sınıfları **hiçbir bileşende kullanılmıyordu**. Sınıflar bağlandı; fark artık
  ölçülebilir (Klasik 3 sütun / Minimal 4 sütun / Editoryal 2 geniş sütun vb.).
- **Her temaya kendi hero mimarisi (`d18710f`):** tek hero + değişken yerine
  dört ayrı DÜZEN — split · editorial (koyu dergi kapağı) · gallery (foto
  mozaiği + camlı kart) · compact (fotoğrafsız alçak banner + kategori
  kısayolları). Hero artık `featured` ilan künyesi, `galleryImages` ve
  `quickLinks` verisi de alıyor. 390px'te yatay taşma yok.

### B) Kira & sözleşme modülü (`e6ca810`, `4bc48d3`)
- Şema: `Contact.nationalId/address`, `RentalAgreement.propertyAddress /
  ownerName / ownerNationalId / increaseRate`. Hepsi nullable.
- **Sözleşme belgeleri `Contract` modeline bağlandı** (`Contract.rentalAgreementId`
  + `fileName`); ayrı dosya alanları RentalAgreement'tan kaldırıldı — fileUrl/
  fileKey/signedAt/expiresAt altyapısı yeniden kullanılıyor.
- API'de alan bazlı doğrulama (`fieldErrors`), satır içi kiracı ekleme
  (`newContact` → TENANT_C tipiyle Müşteriler'e düşer), R2'ye presigned PDF
  yükleme (15 MB).

### C) Şema senkronu deploy hattına alındı (`cac12d8`) — **tuzak kapandı**
`scripts/db-sync.mjs` + `vercel.json` buildCommand:
`prisma generate && node scripts/db-sync.mjs && next build`.
- Yalnız **production** deploy'da çalışır (preview şemayı değiştirmez).
- `--accept-data-loss` GEÇİLMEZ → veri kaybettirecek değişiklikte **build düşer**,
  canlı sürüm çalışmaya devam eder. En kötü senaryo "deploy olmaz", "veri silinir" değil.
- Yerelde hiç çalışmaz; `npm run build` davranışı aynı.

---

## 3. `c2fbaf3` sonrası büyük resim (41 commit)

Bu kılavuzun bir önceki sürümü `c2fbaf3`'te kalmıştı. Aradaki iş, dört kümede:

| Küme | Ne oldu |
|---|---|
| **Tek marka dili** (`292700e`, `9cab259`) | Amber+lacivert ve selvi yeşili **bırakıldı** → monokrom siyah/gri/beyaz sistem. `--app-brand-fill: #1d1d1f`. Plan: `docs/TEK-MARKA-DILI-PLANI.md` |
| **AI Stüdyo** (`dfb7a5d`→`2374ccb`) | Foto iyileştirme preset omurgası; **Vitrin Sunucusu** (AI avatar sunucu, Kling AI Avatar v2) uçtan uca — sinematik paket, drone iniş açılışı, arka plan atmosferi, Zaman Akışı & Gölge Oyunu şablonları |
| **Faturalama** (`29593e0`, `7646605`) | 4 katman (Ücretsiz/Pro/Premium/Kurumsal) + kredi sistemi. **1 video = 100 kredi**; eski "1 kredi = 1 sahne" birimi ×20 taşındı (`scripts/migrate-credits-x20.ts`) |
| **Sosyal OS** (`ab880bf`→`8a864f6`) | Planlayıcı, marka kiti, takvim kuyruğu, Stüdyo↔Sosyal köprüsü. **İki karar:** otomatik yayın KAPSAM DIŞI (ürün içerik hazırlar, paylaşımı emlakçı yapar) ve **GPT çağrısı kaldırıldı** — içerik `lib/social-os/templates.ts` + `render.ts` şablonlarından üretiliyor (maliyet 0, anlık, parse hatası imkânsız) |
| **Landing & SEO** (`48aa676`, `a3b70e6`, `a3c8582`, `5ab276f`) | Monokroma görsel derinlik katmanı, "Ne sunuyoruz" yeniden tasarımı, ince içerik kapısı (5 ilan altındaki vitrinler indekslenmiyor), yanlış vaatlerin temizliği |

---

## 4. Mimari & konvansiyonlar (uyulması gereken)

- **Stil:** Tailwind v4 + `app/globals.css` token'ları: `bg-paper`, `text-ink`,
  `text-ink/55`, `bg-brand-600`, `border-ink/10`, `font-display`, `font-mono`.
  **Marka = monokrom** (`--app-brand-fill: #1d1d1f`; koyu temada `#46464e`).
  Ham CSS dökme; token kullan. *(Eski kılavuzdaki "selvi yeşili #1e5b3e" ARTIK
  GEÇERSİZ — `.btn-selvi` sınıf adı tarihsel kalıntı, rengi monokrom.)*
- **Tema (gece/gündüz):** `--app-*` token'ları. Yeni bileşen ikisini de gözetsin.
- **Vitrin temaları:** bileşen tema ADINI bilmez; `sc-grid / sc-card / sc-media /
  sc-title / sc-h2 / sc-hero / sc-section` sınıflarını taşır, değerler
  `[data-showcase-theme]` altındaki `--sc-*` değişkenlerinden gelir. Hero düzeni
  istisna: `ShowcaseHeroLayout` ile dallanır.
- **Dikey-farkındalık:** kullanıcıya görünen etiketler `getVertical(vertical).labels`'tan.
- **Tenant izolasyonu:** CRM sorgularında `forTenant(session.tenantId)`
  (`lib/tenant.ts`). Public vitrin sorguları `prisma` + explicit `where: { tenantId }`.
- **Auth:** `getSession()` → `{ tenantId, userId, role, name, tenantName, vertical }`.
- **Doğrulama tercihi:** `npx tsc --noEmit` + `npm run build` yeterli; tarayıcı
  testini kullanıcı yapar. Deploy yalnızca istenince.
  `next.config.ts`'te `typescript.ignoreBuildErrors=true` — tip hatası build'i
  bloklamaz ama RUNTIME hatası verir.

---

## 5. Kilit dosyalar

| Alan | Dosya |
|---|---|
| Landing | `app/page.tsx`, `components/landing/*` |
| Vitrin sayfası | `app/ofis/[slug]/page.tsx` |
| Vitrin temaları | `lib/showcase-themes.ts`, `app/globals.css` (`--sc-*`) |
| Vitrin bileşenleri | `components/showcase-{hero,card,collections,workspace,map,fx}.tsx` |
| İlan detay | `app/ofis/[slug]/ilan/[id]/page.tsx` + `components/showcase-{listing-card,rail}.tsx` |
| Ayarlar | `app/(app)/ayarlar/page.tsx`, `components/settings-form.tsx`, `app/api/settings/route.ts` |
| Fiyat/limit/kredi | `lib/plans-config.ts` (istemci-güvenli) · `lib/plans.ts` (server) |
| AI Stüdyo | `components/studio-*.tsx`, `lib/studio-*.ts`, `app/(app)/dashboard/studio/` |
| Sosyal OS | `app/(app)/sosyal/*`, `lib/social-os/`, `lib/social.ts` |
| Kira & sözleşme | `components/rental-manager.tsx`, `lib/rentals.ts`, `lib/contract.ts`, `app/api/rentals/` |
| Portal yayını | `lib/portals.ts`, `lib/feed.ts`, `app/api/feed/[token]/route.ts` |
| Veri modeli | `prisma/schema.prisma` (35 model, 27 enum) |
| Şema deploy | `scripts/db-sync.mjs`, `vercel.json` |

---

## 6. Kalan işler (öncelik sırası)

1. **İlan detay sayfası temadan etkilenmiyor.** `sc-*` sınıfları yalnız 4
   bileşende bağlı (hero, card, collections, workspace). `showcase-listing-card.tsx`
   ve `showcase-rail.tsx` sabit stilde — Premium bir ofis tema seçtiğinde ilan
   detayına girince tema kayboluyor. Tema sisteminin görünür açığı, ilk iş bu.
2. **AI Stüdyo — before/after + gerçek videolar:** landing demosundaki AI Stüdyo
   sekmesi hâlâ gradient placeholder; videolar hazır olunca gerçek öncesi/sonrası
   ve tanıtım videoları konacak.
3. **İlk-giriş onboarding:** `SetupChecklist` (`d1e9a92`) var ama yeni ofise iyi
   varsayılan vitrin içeriği (hero başlığı, hakkımızda) öneren akış yok.
4. **Sosyal OS kalanı:** DnD takvim, onay akışı, 30/60/90 günlük plan.
   (Meta auto-publish **iptal** — bkz. `docs/sosyal-os-durum-ve-plan.md`.)
5. **Online ödeme:** kredi yüklemesi şimdilik manuel havale → süper-admin bakiyeyi
   yükler. iyzico bağlanınca webhook aynı `CreditLog` akışını kullanacak.
6. **Prestij demo `visionText`** hâlâ video-merkezli — Ayarlar > Vitrin'den güncellenmeli.

---

## 7. ⚠️ Tuzaklar / dikkat

- **Şema senkronu artık otomatik** (`scripts/db-sync.mjs`, production deploy'da).
  Elle `npx prisma db push` çalıştırmak **gerekmez ve risklidir**: local `.env`
  prod DB'ye bakıyor olabilir. Şema değişikliğini commit'le, deploy uygulasın.
  Veri kaybı gerektiren değişiklikte build düşer — bu kasıtlı.
- **Deploy = `main`'e push.** Feature dalı push'u yalnız Vercel PREVIEW üretir
  (preview şemayı değiştirmez).
- **Fiyatlar kesinleşti** (Esa, 24 Tem 2026): video ₺450 · Premium ₺4.500/ay
  (10 video) · Kurumsal ₺14.900/ay (50 video) · Pro yıllık ₺25.000 · yıllıkta
  2 ay hediye. Landing bunları göstermiyor, "Teklif al" diyor (`84a5f45`) —
  değiştirirken `lib/plans-config.ts` ile senkron tut.
- **Landing demo içeriği temsilî**; gerçek fotoğraflar `prestij-gayrimenkul`
  tenant'ından gelir (`app/page.tsx` `getDemoListings`).
- **Yeni foto kaynağı** eklersen `next.config.ts` remotePatterns + CSP
  (`lib/security-headers.ts`) ikisine birden ekle.
- **Ölü kod:** kullanılmayan eski landing bileşenleri (`video-hero`,
  `before-after`, `template-gallery`, `scrub-hero`, `marquee`) repoda duruyor,
  import edilmiyor.

---

## 8. Çalıştırma / build / deploy

```bash
npm install
npm run dev            # localhost:3000
npx tsc --noEmit       # tip kontrolü (asıl doğrulama)
npm run build          # prod build kapısı (prisma generate + next build)
git push origin main   # = prod deploy (Vercel) + şema senkronu
```

Cron'lar (`vercel.json`): rollup 03:00 · social-sync 04:00 · studio-reconcile 05:00 ·
appointment-reminders 06:00 · rental-reminders 08:00 (UTC).

Test hesabı (seed): `sahibi@atlasgayrimenkul.com` / `demo1234` ·
demo vitrin ofisi: `prestij-gayrimenkul`.

---

## 9. Yol haritası dokümanları

| Doküman | İçerik |
|---|---|
| `docs/VISION-2.0-YOL-HARITASI.md` | Ürün vizyonu |
| `docs/TEKNIK-YOL-HARITASI.md` | Teknik plan |
| `docs/vitrin-evrensel-tasarim-plani.md` | Vitrin Faz 1–2 (**ikisi de tamam**) |
| `docs/TEK-MARKA-DILI-PLANI.md` | Monokrom marka sistemi |
| `docs/AI-SOCIAL-MEDIA-OS.md` + `docs/sosyal-os-durum-ve-plan.md` | Sosyal OS blueprint + durum |
| `docs/ICERIK-STUDYO-YOL-HARITASI.md` | AI Stüdyo |
| `docs/fiyatlandirma-calismasi.md` | Fiyat/marj analizi |
| `docs/seo-buyume-plani.md`, `docs/seo-rekabet-analizi.md`, `docs/landing-copy-seo.md` | SEO |
</content>
