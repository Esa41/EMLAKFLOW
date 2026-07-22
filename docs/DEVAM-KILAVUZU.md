# EmlakFlow — Proje Durumu & Devam Kılavuzu (Handoff)

> Temmuz 2026. Bu doküman, yeni bir asistan/geliştiricinin (ör. Cline) projeyi hızla
> kavrayıp **kaldığı yerden devam etmesi** için yazıldı. Kısa oku, sonra ilgili
> dosyalara git. Tek gerçek kaynaklar: `lib/plans.ts` (fiyat/limit),
> `lib/verticals.ts` (dikey/etiket), `components/nav-items.ts` (panel menüsü),
> `prisma/schema.prisma` (veri modeli).

---

## 1. Proje ne, canlı durum

**EmlakFlow** — emlak ofisleri için **ücretsiz web sitesi (vitrin) + CRM** sunan çok
kiracılı (multi-tenant) Next.js SaaS. Dikey-farkında: `REAL_ESTATE` / `AUTO_DEALER`
(GaleriFlow) / `MULTI`.

- **Canlı:** https://emlakflow.app — Vercel. **`main`'e push = otomatik prod deploy.**
  (`vercel --prod` GEREKMEZ; çift deploy olur.)
- **Stack:** Next.js 15 (App Router) · React 19 · Tailwind v4 · Prisma 6 + Neon Postgres ·
  next-auth v5 · R2 (medya) · Mapbox/Leaflet · AI SDK (OpenAI).
- **DB:** Neon `neondb` (endpoint `ep-wandering-snow-at5fzzrm`). **Local `.env` = prod DB**
  (aynı veritabanı). Migration YOK; şema `npx prisma db push` ile senkronlanır.
- **Git:** `main` = prod. Son deploy commit'i: `c2fbaf3`.

---

## 2. Bu oturumda ne yapıldı (deploy edildi)

### A) Landing baştan yazıldı — CRM-önce (`components/landing/`)
- **Konumlandırma:** "CRM" jargonu YOK; emlakçı diliyle → ana kanca **ücretsiz web sitesi**
  (5 ilan + bio). Video ikincil, krediyle.
- `landing-content.tsx` — hero + gömülü **interaktif dashboard demosu** + "ücretsiz website"
  bandı + özellikler + 3-katman fiyat + nasıl çalışır + CTA.
- `crm-preview.tsx` — hero'daki **tıklanabilir/animasyonlu panel demosu**. Kenar menü
  GERÇEK panel etiketleriyle (Bugün/Portföy/Satış Hattı/Kira Takibi/AI Stüdyo/Analitik),
  boşta auto-advance. Portföy sekmesi gerçek ilan fotoğrafları gösterir (aşağı bak).
- `pricing-compare.tsx` — "Tüm özellikleri karşılaştır" → Ücretsiz/Pro/Premium matrisi.
- `landing-nav.tsx` — açık-hero uyumlu (koyu metin) hale getirildi.
- `app/page.tsx` — SEO metadata (title/desc/keywords) + demo ilanları çekip landing'e geçer.
- **Kullanılmayan eski landing WIP** repoda duruyor ama render EDİLMİYOR: `video-hero.tsx`,
  `before-after.tsx`, `template-gallery.tsx`, `scrub-hero.tsx`, `marquee.tsx` vb. Silinebilir
  ya da ileride kullanılabilir.

### B) Vitrin (ofis sayfası) v2 — "Apple × Airbnb" (`app/ofis/[slug]/` + `components/showcase-*`)
- **Hero** (`showcase-hero.tsx`): tam ekran **gerçek ilan fotoğrafı** + hafif parallax +
  ortalanmış dev tipografi + camlı istatistik şeridi. (Eski parallax "blueprint" tasarım gitti.)
- **Kartlar** (`showcase-card.tsx`): **Airbnb tarzı** — kenarlıksız yuvarlak foto + kalp favori,
  temiz metin. Blueprint "künye plakası" ve "ölçü çizgisi" KALDIRILDI.
- **Hakkımızda / Vizyon / Danışmanlar** (page.tsx inline) + **portföy header** (workspace) +
  **talep formu** + **son tamamlananlar** → hepsi Apple-minimal (ortalanmış büyük ifade,
  dev pull-quote vizyon, temiz kartlar).
- **Düzenlenebilir vitrin başlığı:** yeni `Tenant.showcaseHeadline` alanı. Hero başlığı artık
  `showcaseHeadline || güçlü varsayılan` (eskiden `aboutTitle`'a bağlıydı, kafa karıştırıcıydı).
  Ayarlar > Vitrin'de "Vitrin başlığı" input'u eklendi.

### C) Yeni özellikler
- **⌘K komut paleti** (`components/command-palette.tsx` + `app/api/search/route.ts`): global
  arama (ilan/kişi) + hızlı aksiyon. `app/(app)/layout.tsx`'e mount.
- **İlan bazında portal yayın seçimi**: `Listing.platforms String[]` + `lib/portals.ts` +
  ilan formunda çoklu portal + `app/api/feed/[token]` portal filtresi. (Boş = tüm açık portallar.)

### D) Deploy
`c2fbaf3` → `main` → Vercel prod. Canlı doğrulandı (landing + vitrin + yeni başlık render oldu,
DB kolonları prod'da mevcut).

---

## 3. Mimari & konvansiyonlar (uyulması gereken)

- **Stil:** Tailwind v4 + `app/globals.css` token'ları. Renk/spacing sınıfları:
  `bg-paper`, `text-ink`, `text-ink/55`, `bg-brand-600`, `text-brand-600`, `bg-brand-50`,
  `border-ink/10`, `font-display`, `font-mono`. **Marka = selvi yeşili** (`--app-brand-fill`
  `#1e5b3e`). Ham CSS dökme; bu token'ları kullan.
- **Tema:** gece/gündüz uyumluluğu var (`--app-*` token'ları). Yeni bileşenler ikisini de gözetsin.
- **Dikey-farkındalık:** kullanıcıya görünen etiketler `getVertical(vertical).labels`'tan gelir.
  Yeni portföy/dikey işlerinde bunu kullan.
- **Tenant izolasyonu:** CRM sorgularında `forTenant(session.tenantId)` (bkz. `lib/tenant.ts`).
  Public vitrin sorguları `prisma` + explicit `where: { tenantId }`.
- **Auth:** `getSession()` → `{ tenantId, userId, role, name, tenantName, vertical }`.
- **Doğrulama tercihi:** `npx tsc --noEmit` yeterli; tarayıcı testini kullanıcı yapar. Deploy
  yalnızca istenince. `next.config.ts`'te `typescript.ignoreBuildErrors=true` (tip hatası
  build'i bloklamaz ama RUNTIME hatası verir — dikkat).

---

## 4. Kilit dosyalar

| Alan | Dosya |
|---|---|
| Landing | `app/page.tsx`, `components/landing/{landing-content,crm-preview,pricing-compare,landing-nav}.tsx` |
| Vitrin sayfası | `app/ofis/[slug]/page.tsx` |
| Vitrin bileşenleri | `components/showcase-{hero,card,collections,workspace,map}.tsx` |
| İlan detay | `app/ofis/[slug]/ilan/[id]/page.tsx` + `components/showcase-{listing-card,rail}.tsx` |
| Ayarlar (vitrin metinleri) | `app/(app)/ayarlar/page.tsx`, `components/settings-form.tsx`, `app/api/settings/route.ts` |
| Fiyat/limit | `lib/plans.ts` |
| Portal yayını | `lib/portals.ts`, `lib/feed.ts`, `app/api/feed/[token]/route.ts` |
| Komut paleti | `components/command-palette.tsx`, `app/api/search/route.ts` |
| Veri modeli | `prisma/schema.prisma` |
| Yol haritası | `docs/VISION-2.0-YOL-HARITASI.md` |

---

## 4b. Sosyal OS MVP (Tem 2026 — başlandı)

Blueprint: `docs/AI-SOCIAL-MEDIA-OS.md`. Canlı rota: **`/sosyal`** (menü: Sosyal OS).
`/icerik` → `/sosyal/takip` redirect. Şema: `BrandKit`, `ContentAsset`, `CalendarItem`
(+ `SocialPlatform` genişletme, `SocialPost.status/scheduledAt`).

Çalışan: hub, marka kiti, AI planlayıcı (ilandan JSON içerik), takvim kuyruğu, eski takip paneli.
Sırada: Meta auto-publish, DnD takvim, onay akışı, 30/60/90 plan.

---

## 5. Kalan işler (öncelik sırası)

1. **İlan detay sayfası "benzer ilanlar" rayı** hâlâ eski blueprint stilinde
   (`showcase-listing-card.tsx`, `showcase-rail.tsx`) → v2'ye çevir (bkz. `showcase-card.tsx` deseni).
2. **AI Stüdyo — before/after + gerçek videolar:** landing demosundaki AI Stüdyo sekmesi ve ilgili
   alanlara, videolar hazır olunca **öncesi/sonrası foto iyileştirme + gerçek tanıtım videoları**
   konacak (şu an şablon gradient placeholder).
3. **İlk-giriş onboarding:** yeni kaydolan ofise, iyi varsayılan vitrin içeriği önerisi (hero başlığı,
   hakkımızda) sunan bir akış.
4. **Prestij demo `visionText`** hâlâ video-merkezli ("video önce gelir") — Ayarlar > Vitrin'den
   güncellenmeli (tenant seed verisi).
5. Landing'in geri kalan alt bölümleri (nasıl çalışır görselleri vb.) daha da cilalanabilir.

---

## 6. ⚠️ Tuzaklar / dikkat

- **Şema değişince `npx prisma db push` ŞART.** Migration yok. Kolon eklersen (ör. son eklenen
  `platforms`, `showcaseHeadline`) push etmeden kod deploy edilirse, o kolonu SELECT eden her
  sayfa RUNTIME'da 500 verir (tsc yakalamaz — `ignoreBuildErrors` açık). Local `.env` = prod DB
  olduğu için local push prod'u da kapsar; ama emin ol.
- **Deploy = `main`'e push.** Feature dalı push'u yalnız Vercel PREVIEW üretir, prod DEĞİL.
- **Fiyatlar TASLAK:** Landing'deki Pro ₺599/ay + kredi/jeton fiyatları **kesinleşmedi**;
  fiyat çalışması bekliyor. `lib/plans.ts` ile senkron tutulmalı.
- **Landing demo içeriği** (dashboard sayıları, ilan görüntülenme vb.) **temsilî**; gerçek foto'lar
  `prestij-gayrimenkul` tenant'ından gelir (`app/page.tsx` `getDemoListings`).
- **Görsel placeholder'lar:** vitrin/landing'de gerçek ilan fotoları R2/Unsplash'ten gelir
  (`next.config.ts` remotePatterns'da izinli). Yeni foto kaynağı eklersen oraya ekle + CSP
  (`lib/security-headers.ts`).
- **Kullanılmayan eski landing bileşenleri** (video-hero/before-after/template-gallery/scrub-hero)
  repoda ölü kod olarak duruyor; import edilmiyor.

---

## 7. Çalıştırma / build / deploy

```bash
npm run dev            # localhost:3000
npx tsc --noEmit       # tip kontrolü (asıl doğrulama)
npm run build          # prod build (deploy öncesi kapı)
npx prisma db push     # şema değişince (DB'ye kolon/tablo ekler)
git push origin main   # = prod deploy (Vercel)
```

Test hesabı (seed): `sahibi@atlasgayrimenkul.com` / `demo1234` · demo vitrin ofisi:
`prestij-gayrimenkul` (İstanbul, foto'lu 6 ilan).
