# EmlakFlow — Gayrimenkul Karar Destek Merkezi
## Teknik Yol Haritası (v1 · Temmuz 2026)

Bu doküman, EmlakFlow'u ilan/CRM aracından **Karar Destek Merkezi (SaaS)** seviyesine
taşıyan üç katmanın teknik tasarımıdır. Tüm tasarım mevcut ESAPP mimarisine
(satır bazlı çok kiracılılık → `lib/tenant.ts` `forTenant()`, Next.js 15 App Router,
Neon PostgreSQL + Prisma, Cloudflare R2, NextAuth v5) **eklemeli** olarak kurgulanmıştır —
hiçbir mevcut modül yeniden yazılmaz.

---

## 0. Mevcut Envanter (üzerine inşa edeceklerimiz)

| Var olan | Dosya | Yol haritasındaki rolü |
|---|---|---|
| Tenant izolasyonu | `lib/tenant.ts` | Tüm yeni modeller `TENANT_MODELS` setine eklenir |
| Eşleştirme motoru (skor 0–100) | `lib/matching.ts` | Bölüm 2.3'ün çekirdeği — çift yönlü hale getirilecek |
| Komisyon motoru | `lib/commission.ts` | Fiyat tahmini için kapanmış işlem verisi kaynağı |
| Bildirim sistemi | `Notification` modeli + zil | Insight motorunun teslimat kanalı |
| Vitrin + lead yakalama | `app/ofis/[slug]`, `api/ofis/[slug]/lead` | Funnel'ın CONTACT adımı zaten ölçülüyor |
| Canlı sohbet | `Message` + `/sohbet` | Funnel'ın CHAT sinyali |
| XML feed | `lib/feed.ts` | Portal yayını — DOM hesabında "yayın başlangıcı" |
| R2 yükleme | `lib/r2.ts`, `api/uploads` | Görsel pipeline'ının giriş noktası |
| Aktivite günlüğü | `Activity` | Rapor ve insight'ların kanıt izi |

---

## 1. Veri Modeli Genişletmesi (Prisma / Neon)

Tek migration'da eklenecek yeni modeller. **Hepsi `tenantId` taşır ve
`lib/tenant.ts` içindeki `TENANT_MODELS` setine eklenir** (unutulursa çapraz-tenant
sızıntı riski — bu set bizim güvenlik çekirdeğimiz).

```prisma
// ── Funnel & analitik ──────────────────────────────────────

enum EventType {
  IMPRESSION   // vitrin listesinde karta görünüm
  VIEW         // ilan detay sayfası açılışı
  CLICK        // telefon/WhatsApp/e-posta tıklaması
  CONTACT      // lead formu gönderimi
  CHAT         // canlı sohbet başlatma
}

model ListingEvent {
  id        BigInt    @id @default(autoincrement())   // cuid değil! yüksek hacim → bigserial
  tenantId  String
  listingId String
  type      EventType
  sessionId String?   // ziyaretçi oturumu (widget'taki v_xxx ile aynı üretim)
  source    String?   // "vitrin" | "feed:sahibinden" | "qr" ...
  createdAt DateTime  @default(now())

  @@index([tenantId, listingId, type, createdAt])
  @@index([createdAt(ops: raw("brin"))], type: Brin)   // zaman-serisi → BRIN, B-tree'nin ~%1'i boyutunda
}

// Günlük özet (ham eventler 90 gün sonra budanır, özetler kalır)
model ListingDailyStat {
  id          String   @id @default(cuid())
  tenantId    String
  listingId   String
  day         DateTime @db.Date
  impressions Int      @default(0)
  views       Int      @default(0)
  clicks      Int      @default(0)
  contacts    Int      @default(0)
  chats       Int      @default(0)

  @@unique([tenantId, listingId, day])
  @@index([tenantId, day])
}

// ── Yaşam skoru ────────────────────────────────────────────

model LocationScore {
  id         String   @id @default(cuid())
  tenantId   String
  listingId  String   @unique
  walkScore  Int      // 0–100
  breakdown  Json     // { school: {count, nearestM}, health: {...}, transit: {...}, market: {...}, park: {...} }
  computedAt DateTime @default(now())

  @@index([tenantId])
}

// POI önbelleği tenant'a özel DEĞİL — coğrafi veri ortaktır (grid hücresi bazlı)
model PoiCache {
  id        String   @id @default(cuid())
  gridKey   String   @unique  // "41.02,28.97" → ~1km hücre (2 ondalık)
  pois      Json     // Overpass yanıtının sadeleştirilmiş hali
  fetchedAt DateTime @default(now())
}

// ── AI fiyat tahmini ───────────────────────────────────────

model PriceEstimate {
  id           String   @id @default(cuid())
  tenantId     String
  listingId    String
  low          Decimal  @db.Decimal(14, 2)
  mid          Decimal  @db.Decimal(14, 2)
  high         Decimal  @db.Decimal(14, 2)
  confidence   String   // "low" | "medium" | "high" — emsal sayısına göre
  advice       String   // Claude'un fiyatlama danışmanlığı metni (TR)
  comparables  Json     // kullanılan emsallerin özeti (denetlenebilirlik)
  createdAt    DateTime @default(now())

  @@index([tenantId, listingId, createdAt])
}

// ── SEO & medya (Listing'e alan ekleme) ────────────────────
// model Listing { ... mevcut alanlar ...
//   seoTitle       String?
//   seoDescription String?
//   seoSlug        String?  @unique-değil, tenant içinde: @@unique([tenantId, seoSlug])
// }
// model ListingMedia { ... mevcut alanlar ...
//   altText   String?   // AI üretimi
//   variants  Json?     // { thumb: url, card: url, full: url } — WebP türevleri
//   width     Int?
//   height    Int?
//   blurhash  String?   // lazy-loading placeholder
// }

// ── Insight motoru ─────────────────────────────────────────

enum InsightSeverity { INFO ACTION URGENT }

model Insight {
  id          String   @id @default(cuid())
  tenantId    String
  listingId   String?
  agentId     String?
  rule        String   // "DOM_HIGH" | "PRICE_ABOVE_MARKET" | "NO_IMPRESSIONS" | "FUNNEL_DROP_CONTACT" ...
  severity    InsightSeverity @default(ACTION)
  title       String   // "Fiyatınız bölge ortalamasının %12 üzerinde"
  body        String   // öneri metni (şablon veya AI)
  data        Json?    // hesaplama kanıtı
  actedAt     DateTime?  // danışman "uyguladım" dediğinde
  dismissedAt DateTime?
  createdAt   DateTime @default(now())

  @@unique([tenantId, listingId, rule, createdAt]) // aynı gün aynı kural tekrarı engellenir (gün bazlı)
  @@index([tenantId, dismissedAt, createdAt])
}

// ── Mülk sahibi raporları ──────────────────────────────────

model OwnerReport {
  id         String   @id @default(cuid())
  tenantId   String
  listingId  String
  contactId  String?  // mülk sahibi (Contact, type=SELLER/LANDLORD)
  periodFrom DateTime @db.Date
  periodTo   DateTime @db.Date
  pdfUrl     String?  // R2
  stats      Json     // dönem özeti (görüntülenme, tıklama, DOM, pazar karşılaştırması)
  sentVia    String?  // "whatsapp" | "email" | null (henüz gönderilmedi)
  sentAt     DateTime?
  createdAt  DateTime @default(now())

  @@index([tenantId, listingId, periodTo])
}

// ── Dijital kontrat ────────────────────────────────────────

model ContractTemplate {
  id        String       @id @default(cuid())
  tenantId  String
  type      ContractType // mevcut enum: AUTHORIZATION | VIEWING_FORM | SALE_CONTRACT | RENT_CONTRACT
  name      String
  body      String       // {{placeholders}} içeren şablon metni
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([tenantId, type])
}
// Mevcut Contract modeline eklenecek alanlar:
//   templateId String?
//   draftBody  String?     // doldurulmuş taslak
//   remindAt   DateTime?   // yetki bitişi / ödeme hatırlatması
```

**Neden `ListingEvent.id` BigInt?** Event tablosu yılda milyonlarca satıra ulaşır;
`cuid()` (25 karakter string) yerine `bigserial` hem indeks boyutunu ~%70 küçültür
hem de BRIN korelasyonunu korur.

---

## 2. Bölüm 1 — Katma Değerli Özellikler

### 2.1 Akıllı Harita & Yürünebilirlik Skoru

**Veri kaynağı:** OpenStreetMap Overpass API (ücretsiz, API anahtarı gerekmez).
Leaflet zaten bağımlılıkta (`parsel-map.tsx`, `showcase-map.tsx`) — yeni harita
katmanı mevcut bileşenlere eklenir.

**Akış** (`lib/walkscore.ts` + ilan kaydet/güncelle sonrası tetiklenir):

1. `lat/lng` yoksa skip. Varsa koordinatı 2 ondalığa yuvarla → `gridKey`.
2. `PoiCache`'te varsa (30 günden taze) kullan; yoksa tek Overpass sorgusu:
   `amenity=school|hospital|pharmacy|marketplace`, `shop=supermarket`,
   `highway=bus_stop`, `railway=station|tram_stop`, `leisure=park` — 1200 m yarıçap.
3. Skor: her kategori için mesafe-bozunumlu puan
   `puan = ağırlık × max(0, 1 − mesafe/1200)` — ağırlıklar: ulaşım 30, okul 20,
   sağlık 20, market 20, park 10. Toplam 0–100 → `LocationScore`.
4. Vitrin ilan detayında rozet + kategori kırılımı; haritada POI katmanı.

**Maliyet/risk:** Overpass rate-limit'lidir → istekler kuyruklanır (ilan başına 1 kez,
cache 30 gün). Self-host gerekmez; ölçek büyürse Overpass mirror'a geçiş tek env
değişkenidir (`OVERPASS_URL`).

### 2.2 AI Fiyat Tahminleme ("Fiyatlama Danışmanı")

İki katmanlı: **istatistik emsal analizi** (deterministik, ucuz) + **Claude yorumu**
(danışmanlık metni). Emsal yoksa AI'ya gitmeyiz — uydurma tahmin üretmek yerine
"yetersiz veri" döneriz.

```
lib/pricing.ts
1. Emsal seti: aynı tenant + (opsiyonel: platform geneli anonim) →
   son 12 ay CLOSED_WON deal'ları + SOLD/RENTED ilanlar,
   aynı ilçe (yoksa şehir), aynı tip, ±%30 m² bandı.
2. m² birim fiyat medyanı + IQR → low/mid/high bandı.
3. Claude'a yapılandırılmış istek → danışmanlık metni + bant doğrulaması.
```

Claude çağrısı (`lib/ai.ts` — tüm AI çağrılarının tek geçiş noktası):

```ts
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic(); // ANTHROPIC_API_KEY env

const response = await anthropic.messages.parse({
  model: "claude-opus-4-8",
  max_tokens: 2048,
  thinking: { type: "adaptive" },
  system: FIYATLAMA_SISTEM_PROMPTU, // sabit tut → prompt cache
  messages: [{ role: "user", content: JSON.stringify({ ilan, emsaller, pazarOzeti }) }],
  output_config: {
    format: { type: "json_schema", schema: PriceAdviceSchema }, // { low, mid, high, confidence, advice }
  },
});
```

- **Model:** `claude-opus-4-8` (varsayılan; 5$/25$ per MTok). İlan başına tahmini
  ~2K giriş + ~600 çıkış token → **ilan başına ≈ $0.025**. Aylık 200 yeni ilan ≈ $5.
- **Prompt caching:** sistem promptu sabit ve başta → tekrar isteklerde ~%90 giriş indirimi.
- Sonuç `PriceEstimate`'e yazılır; ilan formunda "Fiyat Danışmanı" paneli olarak gösterilir
  (bant + gerekçe + kullanılan emsaller — danışman güvenmek için kanıt görmeli).

### 2.3 Görsel Pipeline (WebP + lazy-loading)

Mevcut akış: `photo-uploader.tsx` → `api/uploads` (presigned) → R2. Değişiklik:
yükleme **sunucu üzerinden** akar ki dönüşüm yapılabilsin (5 MB altı görseller için
sorun değil; Vercel body limiti 4.5 MB → istemci tarafında ön-küçültme eklenir).

```
api/listings/[id]/media (POST, multipart)
  └─ sharp ile 3 türev üret:
     thumb 320w (kalite 70) · card 768w (kalite 75) · full 1600w (kalite 82) — hepsi WebP
  └─ + 8x8 blurhash placeholder
  └─ R2'ye 3 obje + ListingMedia.variants/width/height/blurhash yaz
```

- `sharp` bağımlılığı eklenir (Vercel'de native destekli).
- Vitrin tarafında `next/image` zaten lazy-loading yapar; `variants` sayesinde
  `sizes`/`srcSet` doğru boyutu seçer, `blurhash` CLS'siz yüklenme sağlar.
- `next.config.ts`'teki R2 remotePattern mevcut — değişiklik yok.
- Eski fotoğraflar için tek seferlik backfill script'i (`scripts/backfill-webp.ts`).

### 2.4 Otomatik SEO

İlan **yayınlandığında** (status → ACTIVE) tek Claude çağrısıyla üretilir,
`Listing.seoTitle/seoDescription/seoSlug` + her medya için `altText` yazılır.
Sonradan elle düzenlenebilir (AI önerisi, dayatma değil).

- Vitrin ilan sayfası `generateMetadata()` bu alanları okur; yoksa mevcut
  başlık/açıklamaya düşer (geriye uyumlu).
- `seoSlug`: `/ofis/atlas/ilan/3-1-kadikoy-moda-satilik-daire-EF-2026-0042` —
  eski `[id]` URL'leri 301 ile korunur.
- Toplu üretim (mevcut portföyün backfill'i) **Batch API** ile yapılır → %50 indirim.
- JSON-LD (`RealEstateListing` schema.org) vitrin detayına eklenir — portallardan
  bağımsız organik trafik bunun üstüne kurulur.

---

## 3. Bölüm 2 — Karar Destek & Analitik (Emlakçı Paneli)

### 3.1 Funnel Ölçümü (önce ölç, sonra analiz et)

Analitiğin tamamı `ListingEvent`'e dayanır; ilk iş ölçümü açmaktır.

**Toplama ucu:** `POST /api/e` (public, tek uç, keepalive/sendBeacon uyumlu):
```
{ t: tenantId, l: listingId, e: "VIEW", s: sessionId }
```
- Vitrin liste kartı görünümü → IntersectionObserver ile IMPRESSION (oturum başına 1)
- İlan detay → VIEW · tel/WhatsApp/e-posta → CLICK · lead formu → CONTACT · sohbet → CHAT
- Uç, `Insert`'ten başka şey yapmaz (<5 ms); bot filtresi user-agent + rate ile.

**Özetleme:** Vercel Cron (gecelik, `api/cron/rollup`) →
`INSERT ... ON CONFLICT DO UPDATE` ile `ListingDailyStat`; 90 günden eski ham
event'ler silinir (özet kalır → tablo boyutu sabitlenir).

**Panel:** `/analitik` sayfası — Recharts `FunnelChart` (Impression→View→Click→Contact),
kopuş yüzdeleri, ilan bazlı tablo. En büyük kopuş adımı otomatik vurgulanır
("İlanınız görüntüleniyor ama tıklanmıyor → kapak fotoğrafı/fiyat sorunu").

### 3.2 Pazar İstihbaratı & DOM

**DOM tanımı:** `ACTIVE` ilanlarda `now − createdAt`; kapananlarda
`closedAt − createdAt` (Deal CLOSED_WON → commission motoru zaten ilanı SOLD yapıyor).

**Materialized View** (Prisma migration'a ham SQL olarak eklenir):

```sql
CREATE MATERIALIZED VIEW mv_market_stats AS
SELECT
  "tenantId", city, district, type, purpose,
  COUNT(*) FILTER (WHERE status = 'ACTIVE')                            AS active_count,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY price / NULLIF("netArea",0))
    FILTER (WHERE status = 'ACTIVE')                                   AS median_sqm_price,
  AVG(EXTRACT(EPOCH FROM (now() - "createdAt")) / 86400)
    FILTER (WHERE status = 'ACTIVE')                                   AS avg_dom_active,
  AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400)
    FILTER (WHERE status IN ('SOLD','RENTED'))                         AS avg_dom_closed
FROM "Listing"
GROUP BY "tenantId", city, district, type, purpose;

CREATE UNIQUE INDEX ON mv_market_stats ("tenantId", city, district, type, purpose);
```

- Yenileme: gecelik cron → `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_market_stats;`
  (unique index sayesinde CONCURRENTLY çalışır → okuma kilitlenmez).
- Prisma'dan okumak için `prisma.$queryRaw` sarmalayıcı: `lib/market.ts`
  (**tenantId parametresi zorunlu** — raw sorgu forTenant extension'dan geçmez,
  izolasyon burada elle sağlanır; bu dosya dışında raw sorgu yazılmaz).
- **Revize önerisi algoritması:** `ilan.DOM > bölge avg_dom_closed × 1.25` VE
  `m² fiyatı > median × 1.1` → Insight `PRICE_ABOVE_MARKET`; sadece DOM yüksekse
  `DOM_HIGH` (fotoğraf/başlık önerisi). Eşikler `Tenant` ayarlarına taşınabilir.

### 3.3 Müşteri Eşleştirme Motoru (genişletme)

`lib/matching.ts` mevcut yönü kapsıyor (yeni ilan → açık lead'ler). Eklenecekler:

1. **Ters yön:** yeni lead → aktif ilanlar (`findMatchingListings` — aynı skor
   fonksiyonunun tersine uygulanması; kod ortaklaştırılır).
2. **Bildirim fan-out:** skor ≥ 70 eşleşmede ilanın danışmanına `Notification`
   (`href: /kisiler/{contactId}`) — altyapı hazır, sadece create çağrısı.
3. **Fırsat önerisi:** eşleşme bildirimi içinde "Fırsat aç" → mevcut
   `createManualDeal` action'ı çağrılır (Kanban'a düşer). Yeni kod neredeyse yok;
   mevcut parçaların bağlanması.

### 3.4 Dijital Kontrat Yönetimi

1. `ContractTemplate` CRUD (Ayarlar → Şablonlar) — `{{musteri.adSoyad}}`,
   `{{ilan.adres}}`, `{{ilan.fiyat}}`, `{{ofis.komisyon}}` yer tutucuları.
2. "Sözleşme oluştur" (ilan veya fırsat detayından) → şablon + ilan + müşteri
   verisi birleştirilir → `Contract.draftBody`; PDF üretimi `@react-pdf/renderer`
   (sunucuda) → R2 → `fileUrl`.
3. **Hatırlatmalar:** `expiresAt`/`remindAt` yaklaşan kontratlar gecelik cron'da
   taranır → `Notification` + Ajanda'ya otomatik `Appointment`. (Yetki belgesi
   bitişi kaçırmak ofisler için gerçek para kaybı — en yüksek algılanan değer burada.)
4. E-imza kapsam dışı (Faz 4+; KEP/e-imza entegrasyonu ayrı yasal analiz ister).
   "Islak imza için çıktı + imzalı PDF'i geri yükleme" akışı yeterli başlangıç.

---

## 4. Bölüm 3 — Operasyonel Otomasyon

### 4.1 Haftalık Mülk Sahibi Raporu

**Akış (Vercel Cron, Pazartesi 07:00):** `api/cron/weekly-reports`
1. Aktif ilanı + `SELLER/LANDLORD` bağlantısı olan her ilan için haftalık
   `ListingDailyStat` özeti + `mv_market_stats` karşılaştırması toplanır.
2. Claude (Batch API — acele yok, %50 indirim) 3-4 cümlelik "durum yorumu" üretir:
   *"Bu hafta ilanınız 214 kez görüntülendi (bölge ortalamasının %30 üzerinde)..."*
3. PDF (`@react-pdf/renderer`: ofis logolu tek sayfa) → R2 → `OwnerReport`.
4. Teslimat: danışmana bildirim + tek tık **WhatsApp paylaşımı**
   (`wa.me/{tel}?text={özet+pdfLink}`). Otomatik gönderim (WhatsApp Business Cloud
   API) Faz 4 — şablon onayı ve işletme doğrulaması gerektirir, MVP'de insan
   onaylı gönderim hem daha güvenli hem yasal olarak temiz.

### 4.2 Otomatik Insight (IF/THEN motoru)

`lib/insights/rules.ts` — her kural saf fonksiyon: `(ctx) => Insight | null`.
Gecelik cron tüm aktif ilanları tek sorguda bağlamıyla çeker, kuralları koşturur.

| Kural | Koşul (IF) | Öneri (THEN) |
|---|---|---|
| `NO_IMPRESSIONS` | 7 günde impression < 10 | "İlanınız görüntülenmiyor — başlığı şu şekilde deneyin" (Claude'dan 2 başlık önerisi) |
| `LOW_CTR` | view/impression < %2 | "Kapak fotoğrafını değiştirin" (en çok tıklanan benzer ilanların kapak analizi) |
| `PRICE_ABOVE_MARKET` | m² fiyat > bölge medyan × 1.1 | "Fiyat bölge ortalamasının %X üzerinde — güncelleyin" |
| `DOM_HIGH` | DOM > bölge kapanış ort. × 1.25 | "İlan bölge ortalamasından %X uzun süredir yayında" |
| `FUNNEL_DROP_CONTACT` | click var, 14 günde contact = 0 | "Telefonlar dönüşmüyor — mesai dışı yönlendirme kurun" |
| `STALE_LEAD` | OPEN lead 14 gündür işlemsiz | "Bu talep soğuyor — arayıp güncelleyin" |
| `AUTH_EXPIRING` | Yetki belgesi 15 gün içinde bitiyor | "Yetki yenileme randevusu oluşturun" |

- Deterministik koşul + (yalnızca metin gereken yerde) AI önerisi → maliyet kontrollü.
- Teslimat: `Insight` kaydı + `Notification`; dashboard'a "Bugünkü Aksiyonlar" bloğu.
- `actedAt/dismissedAt` ölçülür → hangi kuralların işe yaradığını 3 ay sonra veriyle görürüz.

---

## 5. Görselleştirme Katmanı

**Tercih: Recharts** (Chart.js değil). Gerekçe: React 19 + RSC uyumu, deklaratif
bileşen modeli mevcut kod stiliyle aynı, funnel/composed chart hazır; Chart.js
canvas-imperatif ve ref yönetimi gerektirir.

- Grafikler `"use client"` bileşenlerinde; veri **server component'te** çekilip
  props ile geçilir (API round-trip yok, tenant izolasyonu sunucuda kalır).
- `next/dynamic` + `ssr: false` ile yüklenir → ilk sayfa JS'ine girmez.
- Standart bileşen seti: `<FunnelChart>` (dönüşüm), `<AreaChart>` (haftalık trafik),
  `<BarChart>` (ilan karşılaştırma), `<ComposedChart>` (fiyat vs bölge medyanı).
- Tema: mevcut `brand-600` paleti + `lib/labels.ts` para/tarih formatlayıcıları.

---

## 6. Performans Stratejisi

### İndeksleme
| Tablo | İndeks | Tip | Neden |
|---|---|---|---|
| ListingEvent | `(tenantId, listingId, type, createdAt)` | B-tree | Panel sorguları |
| ListingEvent | `(createdAt)` | **BRIN** | Zaman-serisi tarama + budama; insert-sıralı veri ile ~%99 küçük |
| ListingDailyStat | `(tenantId, day)` + unique `(tenantId, listingId, day)` | B-tree | Upsert + dönem raporu |
| Listing | `(tenantId, status) WHERE status = 'ACTIVE'` | **Partial** | Tüm analitik yalnız aktifleri tarar |
| Insight | `(tenantId, dismissedAt, createdAt)` | B-tree | "Açık aksiyonlar" sorgusu |
| Message | mevcut `(tenantId, sessionId, createdAt)` | B-tree | Değişiklik yok |

### Materialized View'ler
- `mv_market_stats` (§3.2) — gecelik `REFRESH ... CONCURRENTLY`.
- Faz 3'te gerekirse `mv_tenant_funnel` (tenant bazlı 30 günlük funnel özeti).
- Neon'da MV'ler normal tablo gibi depolanır; refresh cron'u Vercel'den tetiklenir
  (`api/cron/refresh-views`, `CRON_SECRET` korumalı). Neon auto-suspend nedeniyle
  cron istekleri cold-start toleranslı yazılır (tek retry).

### Hacim kontrolü
- Ham event: 90 gün saklama + gecelik özetleme → tablo boyutu üst sınırlı.
- Event ucu tek INSERT; pgbouncer (pooled DATABASE_URL) mevcut — bağlantı taşması yok.
- İleride (>10M event/ay) `ListingEvent` aylık partition'a geçirilir — şema değişmez.

---

## 7. AI Katmanı — Ortak Altyapı

Tüm çağrılar `lib/ai.ts`'ten geçer (tek client, tek hata/maliyet günlüğü):

| Kullanım | Yöntem | Sıklık | Tahmini maliyet |
|---|---|---|---|
| Fiyat danışmanı | `messages.parse` + json_schema | İlan başına 1 (+manuel yenile) | ~$0.025/ilan |
| SEO meta + alt-text | `messages.parse` | Yayınlamada 1 | ~$0.015/ilan |
| SEO backfill / haftalık rapor yorumu | **Batch API** | Haftalık toplu | %50 indirimli |
| Insight metin önerileri | `messages.create` | Kural tetiklenince | ~$0.01/insight |

- Model: `claude-opus-4-8`, `thinking: {type: "adaptive"}`.
- Sistem promptları sabit dosyalarda (`lib/prompts/`) → prompt cache isabeti.
- Hata yolu: AI çağrısı düşerse özellik sessizce devre dışı kalır (SEO alanı boş
  kalır, fiyat paneli "hesaplanamadı" der) — **hiçbir kullanıcı akışı AI'ya bağımlı değildir.**
- Yeni env: `ANTHROPIC_API_KEY` (+ `.env.example` güncellenir).

---

## 8. Faz Planı

| Faz | Kapsam | Bağımlılık | Süre* |
|---|---|---|---|
| **F1 — Ölçüm temeli** | `ListingEvent` + toplama ucu + günlük özet cron + basit `/analitik` sayfası (Recharts) | — | 1 hafta |
| **F2 — Pazar zekâsı** | `mv_market_stats`, DOM, Insight motoru (AI'sız 4 kural: DOM_HIGH, PRICE_ABOVE_MARKET, STALE_LEAD, AUTH_EXPIRING), dashboard "Bugünkü Aksiyonlar" | F1 (kısmen) | 1–1,5 hafta |
| **F3 — AI katmanı** | `lib/ai.ts`, fiyat danışmanı, otomatik SEO + slug, AI'lı insight kuralları | F2 | 1,5 hafta |
| **F4 — Medya & harita** | sharp/WebP pipeline + blurhash + backfill, yaşam skoru (Overpass) | — (paralel yürüyebilir) | 1 hafta |
| **F5 — Operasyon** | Kontrat şablonları + PDF + hatırlatma, haftalık mülk sahibi raporu + WhatsApp paylaşımı | F2, F3 | 1,5 hafta |
| **F6 — Eşleştirme+** | Ters yön eşleştirme, bildirim fan-out, eşleşmeden tek tık fırsat | — (küçük) | 2–3 gün |

\* tek geliştirici, tam zamanlı varsayımı. F1 önce gelir çünkü **F2-F5'in tamamı
veri birikimine muhtaç** — funnel ve DOM analizi, ölçüm açıldıktan ancak 2-4 hafta
sonra anlamlı sonuç verir. Ölçümü bugün açmak, analitiği bir ay öne çeker.

### Kapsam dışı (bilinçli erteleme)
- WhatsApp Business Cloud API otomatik gönderim (şablon onay süreci) → F5 sonrası
- E-imza/KEP entegrasyonu → yasal analiz sonrası
- Platform-genel anonim emsal havuzu (tenant'lar arası veri paylaşımı → KVKK analizi şart)
- Gerçek zamanlı (SSE/Pusher) analitik — polling/gecelik özet SaaS başlangıcı için yeterli

---

## 9. Riskler & Açık Kararlar

| Risk | Etki | Önlem |
|---|---|---|
| `forTenant` raw-SQL bypass'ı (MV sorguları) | Çapraz-tenant veri sızıntısı | Tüm raw sorgular yalnız `lib/market.ts`'te; tenantId parametresi zorunlu; code review kuralı |
| Overpass rate-limit | Skor hesaplanamaz | Grid cache + kuyruk; skor "nice to have", ilan akışını bloklamaz |
| AI maliyet sürprizi | Bütçe | Tek geçiş noktasında token log; tenant başına aylık AI çağrı limiti (plan bazlı: trial 20, pro sınırsız) — SaaS fiyatlamasının da temeli |
| Event ucu spam/bot | Kirli analitik | Rate limit + UA filtresi + oturum başına impression tekilleştirme |
| Vercel cron 60 sn limiti | Rapor üretimi yarım kalır | Batch API (asenkron) + cron'da sayfalama (`?cursor=`) |
| prisma/migrations yok (db push) | MV'ler push ile taşınmaz | Bu fazla birlikte `prisma migrate` düzenine geçilir (go-live notundaki adım) |
```
