# EmlakFlow — SEO, Büyüme ve Teknik Altyapı Planı

> Temmuz 2026. Bu doküman iki bölümden oluşur: (A) pazarlama/içerik stratejisi,
> (B) koda dökülmüş teknik altyapının kaydı + faz 2 yol haritası.
> Hacim/zorluk değerleri araç verisi değil, Türkiye emlak SaaS pazarı için
> deneyime dayalı öngörüdür; Search Console verisi biriktikçe güncelle.

## A1. Huni odaklı anahtar kelime stratejisi

### ToF — Farkındalık (sorun farkında, çözüm arıyor)

| Anahtar kelime | Aylık hacim (öngörü) | Zorluk | İçerik formatı |
|---|---|---|---|
| emlak ofisi nasıl açılır | 2.400–4.000 | Orta | Rehber (pillar) |
| emlakçılıkta portföy nasıl toplanır | 500–900 | Düşük | Taktik rehber |
| emlak danışmanı ne kadar kazanır | 3.000–5.000 | Orta | Veri içerikli analiz |
| gayrimenkul danışmanlığı yetki belgesi | 1.500–2.500 | Düşük | Mevzuat rehberi |
| emlakçı müşteri bulma yöntemleri | 700–1.200 | Düşük | Liste + şablon |

### MoF — Değerlendirme (çözüm kategorisini kıyaslıyor)

| Anahtar kelime | Aylık hacim (öngörü) | Zorluk | İçerik formatı |
|---|---|---|---|
| emlak crm programı | 800–1.400 | Orta | Kategori sayfası |
| emlak ofisi yazılımı karşılaştırma | 200–400 | Düşük | Karşılaştırma tablosu |
| portföy yönetim programı emlak | 400–700 | Düşük | Özellik sayfası |
| emlak ofisi excel yerine program | 100–250 | Çok düşük | "Excel'den geçiş" rehberi |
| emlakçı ilan takip programı | 300–600 | Düşük | Use-case sayfası |

### BoF — Dönüşüm (satın almaya hazır)

| Anahtar kelime | Aylık hacim (öngörü) | Zorluk | Hedef sayfa |
|---|---|---|---|
| emlakflow (marka) | büyüyecek | — | Ana sayfa |
| emlak crm ücretsiz deneme | 100–200 | Düşük | /register |
| emlak ofisi web sitesi kurma | 500–900 | Orta | Vitrin özellik sayfası |
| emlak komisyon paylaşım programı | 50–150 | Çok düşük | Kazanç paylaşımı sayfası |
| en iyi emlak crm 2026 | 150–300 | Orta | Karşılaştırma + CTA |

**Öncelik sırası:** BoF sayfaları önce (az trafik, yüksek dönüşüm), sonra MoF,
en son ToF hacim makinesi. Her ToF yazısı ilgili MoF sayfasına iç link verir.

## A2. İçerik mimarisi: Pillar → Cluster

Başlıklar SEO'ya göre yazılır — kurallar:

- **Hedef kelime title'ın başında** (Google ilk kelimelere daha çok ağırlık
  verir, mobilde kuyruk kırpılır). "Rehber: Emlak Ofisi Açmak" değil,
  "Emlak Ofisi Nasıl Açılır?".
- **≤60 karakter** (SERP'te kırpılmaz); H1 daha uzun/`doğal` olabilir,
  title ile birebir aynı olmak zorunda değil.
- **Soru formu** aramayla eşleşiyorsa aynen kullan ("nasıl", "ne kadar",
  "hangisi") — People Also Ask kutularına girme şansı verir.
- **Yıl ekle** güncellik sinyali gereken konularda (maliyet, mevzuat,
  karşılaştırma): "2026" hem CTR artırır hem yıllık güncelleme disiplini kurar.
- **Slug kısa ve kelime odaklı**: `/blog/emlak-ofisi-acmak` — yıl ve dolgu
  kelimeler slug'a girmez (yıl değişince URL değişmesin).
- Sayı/parantez CTR kaldıracı: "7 Yöntem", "(Maliyet Tablosu)", "(Şablonlu)".

### Pillar 1 — Emlak Ofisi Kurma `/blog/emlak-ofisi-acmak`

| İçerik | Hedef kelime | Title etiketi | Slug |
|---|---|---|---|
| Pillar | emlak ofisi nasıl açılır | Emlak Ofisi Nasıl Açılır? 2026 Adım Adım Rehber | `emlak-ofisi-acmak` |
| Cluster | taşınmaz ticareti yetki belgesi | Taşınmaz Ticareti Yetki Belgesi Nasıl Alınır? (2026) | `tasinmaz-ticareti-yetki-belgesi` |
| Cluster | emlak ofisi açma maliyeti | Emlak Ofisi Açma Maliyeti 2026: Kalem Kalem Tablo | `emlak-ofisi-acma-maliyeti` |
| Cluster | emlak franchise | Emlak Franchise mı Bağımsız Ofis mi? Karşılaştırma | `emlak-franchise-mi-bagimsiz-mi` |
| Cluster | yeni emlakçı ne yapmalı | Yeni Emlak Ofisinin İlk 90 Günü: Haftalık Plan | `emlak-ofisi-ilk-90-gun` |

### Pillar 2 — Portföy Yönetimi `/blog/emlak-portfoy-yonetimi`

| İçerik | Hedef kelime | Title etiketi | Slug |
|---|---|---|---|
| Pillar | emlak portföy yönetimi | Emlak Portföy Yönetimi: Toplama, Takip ve Satış | `emlak-portfoy-yonetimi` |
| Cluster | emlakçılıkta portföy nasıl toplanır | Emlakçılıkta Portföy Nasıl Toplanır? 7 Kanıtlı Yöntem | `portfoy-nasil-toplanir` |
| Cluster | yer gösterme | Yer Gösterme Süreci: Formdan Kaparoya Adım Adım | `yer-gosterme-sureci` |
| Cluster | emlak değerleme nasıl yapılır | Emlak Fiyatı Nasıl Belirlenir? Emsal Analizi Rehberi | `emsal-analizi-fiyat-belirleme` |
| Cluster | emlak ilan fotoğrafı | İlan Fotoğrafçılığı: Telefonla Profesyonel Çekim | `emlak-ilan-fotografciligi` |

### Pillar 3 — Dijital Pazarlama `/blog/emlak-dijital-pazarlama`

| İçerik | Hedef kelime | Title etiketi | Slug |
|---|---|---|---|
| Pillar | emlak dijital pazarlama | Emlak Ofisleri için Dijital Pazarlama Rehberi 2026 | `emlak-dijital-pazarlama` |
| Cluster | emlak instagram | Instagram'da Emlak İlanı Pazarlama: İçerik Takvimi | `instagramda-emlak-pazarlama` |
| Cluster | emlakçı google haritalar | Google İşletme Profili ile Semtinizde 1. Sıraya Çıkın | `emlakci-google-isletme-profili` |
| Cluster | emlak ofisi web sitesi | Emlak Ofisi Web Sitesi Kurma: 2026 Rehberi (Örnekli) | `emlak-ofisi-web-sitesi-kurma` |
| Cluster | whatsapp müşteri takibi | WhatsApp ile Müşteri Takibi: Emlakçı Mesaj Şablonları | `whatsapp-musteri-takibi` |

### Pillar 4 — CRM ve Otomasyon `/blog/emlak-crm`

| İçerik | Hedef kelime | Title etiketi | Slug |
|---|---|---|---|
| Pillar | emlak crm | Emlak CRM Nedir? Ofisinize Doğru Yazılımı Seçme Rehberi | `emlak-crm` |
| Cluster | emlak excel takip | Excel'den Emlak CRM'e Geçiş: Neden ve Nasıl? (Şablonlu) | `excelden-crm-gecis` |
| Cluster | alıcı eşleştirme | Alıcı-Portföy Eşleştirme: Talebi Satışa Çeviren Sistem | `alici-portfoy-eslestirme` |
| Cluster | emlak komisyon paylaşımı | Emlakçı Komisyon Paylaşımı: Modeller ve Hesaplama | `emlak-komisyon-paylasimi` |
| Cluster | kira takip programı | Kira Takibi Nasıl Yapılır? Otomatik Hatırlatma Sistemi | `kira-takibi` |

### Pillar 5 — Piyasa Verisi `/analiz`

| İçerik | Hedef kelime | Title etiketi | Slug |
|---|---|---|---|
| Pillar | konut fiyatları | Türkiye Konut Fiyatları: İl İl Güncel m² Analizi | `/analiz` |
| Programatik | {ilçe} konut fiyatları | {İlçe} Konut Fiyatları 2026: m² Fiyatı ve Trend | `/analiz/{il}/{ilce}` |
| Cluster | konut kredisi faiz | Konut Kredisi Faiz Oranları: Aylık Güncel Takip | `konut-kredisi-faiz-oranlari` |
| Cluster | kira artış oranı | Kira Artış Oranı Hesaplama (TÜFE, Güncel) | `kira-artis-orani-hesaplama` |

Pillar 5 stratejik silah: EmlakFlow'daki anonimleştirilmiş ilan verisiyle
"İlçe bazında m² fiyat raporu" üretilirse hem backlink mıknatısı hem
programatik SEO tabanı olur. "Kira artış oranı hesaplama" ise A3'teki
tool-bait taktiğiyle birleşir — hesaplayıcı + içerik aynı sayfada.

**İç linkleme kuralı:** her cluster kendi pillar'ına ve konusuyla ilgili en
az 1 ürün sayfasına (ör. `excelden-crm-gecis` → /register) link verir;
pillar tüm cluster'larına link verir. Cluster'lar arası çapraz link serbest,
ama pillar dışına çıkan "ilgisiz" link başına 2-3'ü geçme.

## A3. Sıfır bütçe backlink: 3 gerilla taktiği

1. **Veri gazeteciliği**: Platform verisinden çeyreklik "Türkiye Emlak Ofisi
   Dijitalleşme Raporu" çıkar (ör. "ilanların %X'i hâlâ Excel'de takip
   ediliyor"). Emlak ekonomisi yazan gazetecilere/portallara (Emlakkulisi,
   Emlak365, ekonomi servisleri) hazır grafiklerle servis et. Tek rapor
   10-20 doğal haber linki üretebilir.
2. **Ücretsiz araç (tool-bait)**: "Emlak Komisyon Hesaplama" ve "Kira Artış
   Oranı (TÜFE) Hesaplama" sayfaları — düşük efor, sürekli aranan,
   forum/sözlük/sosyal medyada kendiliğinden link alan araçlar. Landing'e
   `/araclar/*` altında eklenip register hunisine bağlanır.
3. **Vitrin altyapısı = müşteri kaynaklı linkler**: Her vitrin müşterisinin
   kendi sitesinde/sosyal profillerinde vitrin URL'sine link vermesi doğal
   backlink ağıdır. Vitrin footer'ına "EmlakFlow ile oluşturuldu" (dofollow,
   markalı anchor) — Webflow/Notion'un büyüme modeli. Ücretsiz planda açık,
   Pro'da kaldırılabilir yaparsan hem link hem upsell çalışır.

## B1. Teknik altyapı — bu commit'te yapılanlar

| Alan | Uygulama | Dosya |
|---|---|---|
| Güvenlik başlıkları | CSP (Mapbox/R2/Unsplash allowlist), HSTS+preload, XFO DENY, nosniff, Referrer-Policy, Permissions-Policy | `lib/security-headers.ts`, `next.config.ts` |
| Rate limiting | Sliding window: register 5/10dk, vitrin login 10/dk, lead 5/dk (IP başına) | `lib/rate-limit.ts` + 3 route |
| Kök metadata | `metadataBase`, title template, OG/Twitter varsayılanları, googleBot yönergeleri | `app/layout.tsx` |
| Yapısal veri | Landing'e `SoftwareApplication` JSON-LD (mevcut `RealEstateListing`/`RealEstateAgent`/`BreadcrumbList`'e ek) | `app/page.tsx`, `lib/seo.ts` |
| Sitemap | Canonical-parity düzeltmesi (`/ilan/{id}-{slug}`), 1 saat cache (`revalidate = 3600`) | `app/sitemap.ts` |
| CRM noindex | robots.txt disallow + sayfa seviyesi `robots: noindex` | `app/(app)/layout.tsx` |
| Statik cache | `_next/static` → `immutable`, `poweredByHeader: false`, AVIF/WebP | `next.config.ts` |

## B2. Render stratejisi: SSR + ISR hibrit (mevcut ve hedef)

| Rota | Durum | Not |
|---|---|---|
| `/` landing | Static | değişiklik yok |
| `/ofis/[slug]` | SSR (dynamic) | searchParams filtreleri var; doğru tercih |
| `/ofis/[slug]/ilan/[id]` | **ISR ✓** (revalidate 300 + on-demand) | ölçüm: ~3.9s → ~10ms (x-nextjs-cache HIT) |
| `/sitemap.xml` | ISR 1 saat ✓ | |
| CRM `(app)/*` | SSR auth'lu | cache'lenmez, doğru |

**Yapılan ISR geçişi (Temmuz 2026):**

1. Vitrin oturumu client'a taşındı: `SiteSessionProvider`
   (components/site-session-context.tsx) mount'ta tek fetch ile
   `GET /api/ofis/[slug]/auth/session` → { user, favorites[] } çeker;
   `SiteAuthHeader` ve `FavoriteButton` bu context'ten beslenir. Vitrin
   sayfalarında artık cookie OKUNMAZ — okursan rota sessizce dynamic'e döner.
2. İlan sayfasında `export const revalidate = 300` + **boş
   `generateStaticParams()`**. Kritik Next 15 tuzağı: generateStaticParams
   olmadan dinamik segment ISR makinesine hiç kaydedilmiyor (prerender
   manifest'e girmiyor), revalidate sessizce yok sayılıyor.
3. On-demand tazeleme: `lib/revalidate-showcase.ts` →
   `revalidateListingShowcase()` ilan PATCH/DELETE ve medya POST/DELETE
   sonrası iki URL biçimini de temizler ("/ilan/{id}" + "/ilan/{id}-{slug}").
   Fiyat/foto değişikliği 5 dk beklemeden vitrine düşer.

**İkinci kritik tuzak (yaşandı):** `/_next/static` için elle
`Cache-Control: immutable` başlığı VERME. Dev'de chunk'lar hash'siz;
tarayıcı bayat chunk'ları immutable diye saklayıp "Cannot read properties
of undefined (reading 'call')" hatasıyla sayfayı kırıyor. Vercel
production'da bu başlığı zaten otomatik veriyor.

## B3. Sitemap >50k URL parçalama planı (gerektiğinde)

`generateSitemaps` ile ilanlar 10k'lık parçalara bölünür; Next her parçayı
`/sitemap/[id].xml` olarak servis eder. Next otomatik index üretmediği için
robots.ts'e parça URL'leri ayrı ayrı `sitemap: [...]` dizisi olarak verilir:

```ts
// app/sitemap.ts
export async function generateSitemaps() {
  const count = await prisma.listing.count({ where: { status: "ACTIVE" } });
  return Array.from({ length: Math.ceil(count / 10_000) }, (_, id) => ({ id }));
}
export default async function sitemap({ id }: { id: number }) {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" },
    skip: id * 10_000,
    take: 10_000,
    select: { id: true, slug: true, updatedAt: true, tenant: { select: { slug: true } } },
  });
  /* ... entries ... */
}
```

## B4. Faz 2 durumu

Tamamlananlar (Temmuz 2026):

- ✅ **OG görselleri**: `app/opengraph-image.tsx` (global fallback) +
  `app/ofis/[slug]/opengraph-image.tsx` (markalı ofis kartı, tenant
  brandColor'lı). İlan detayları kapak fotoğrafını kullanmaya devam eder
  (alt segmentin metadata'sı üst segmentin dosya-tabanlı görselini ezer).
  Not: dosya-tabanlı metadata rotaları middleware PUBLIC_PATHS'e eklendi —
  yoksa crawler og:image isteği login'e 307'lenir.
- ✅ **İlan ISR geçişi** (B2'ye bakınız).
- ✅ **Speed Insights**: `@vercel/speed-insights` kuruldu, root layout'ta;
  CSP'de `va.vercel-scripts.com` (script-src) + `vitals.vercel-insights.com`
  (connect-src) izinli.
- ✅ Vitrin title'ları beyaz etiket: layout'ta `template: "%s"` + ofis ana
  sayfasında `title: { absolute }` (template yalnız ALT segmentlere uygulanır).

- ✅ **Blog altyapısı + ilk 4 makale** (Temmuz 2026): dosya tabanlı, tamamen
  statik (SSG). Kayıt defteri `lib/blog.ts` (meta + backlog), içerik
  `content/blog/*.tsx`, rotalar `app/blog`. Her yazıda BlogPosting +
  BreadcrumbList JSON-LD, canonical, CTA kutusu ve pillar-içi ilgili
  yazılar var; sitemap ve landing nav/footer bağlandı. Yayında:
  emlak-crm, excelden-crm-gecis, portfoy-nasil-toplanir, emlak-ofisi-acmak.
  Kalan 16 başlık `PLANNED_POSTS` içinde — yazı hazır olunca
  content/blog/'a ekle, BLOG_POSTS'a taşı.

Kalanlar (öncelik sırasıyla):

1. **Dağıtık rate limit**: trafik büyüyünce `@upstash/ratelimit` + Redis;
   `lib/rate-limit.ts` API'si aynı kalacak şekilde içi değiştirilir.
2. **Programatik SEO**: Pillar 5 veri sayfaları (`/analiz/[il]/[ilce]`).
3. **CSP nonce'a geçiş**: `'unsafe-inline'` yerine middleware'de nonce üretimi
   (Next.js resmi tarifi) — önce Report-Only ile dene.
4. **Sitemap parçalama** (>50k URL'de, B3'e bakınız).

## B5. Neon + Prisma güvenlik durumu (mevcut, doğru kurulmuş)

- `DATABASE_URL` pooler host (`-pooler` + `pgbouncer=true`), `DIRECT_URL`
  migration'lar için direkt host — `prisma/schema.prisma` doğru.
- SQL injection: tüm erişim Prisma Client üzerinden (parametrize);
  `$queryRawUnsafe` kullanma, ham sorgu gerekirse `$queryRaw` tagged template.
- Tenant izolasyonu: `forTenant()` extension satır bazlı filtre zorluyor —
  yeni modellerde `tenantId` kolonunu ve extension kullanımını atlama.
- Neon auto-suspend: ilk istekte cold-start olabilir; cron'lar (vercel.json)
  fiilen keep-alive görevi de görüyor.
