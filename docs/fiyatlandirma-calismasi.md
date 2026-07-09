# EmlakFlow Fiyatlandırma Çalışması

> Temmuz 2026. Fiyat/limit tek kaynağı: `lib/plans.ts` PLANS sabiti.
> Landing bölümü: `components/landing/pricing-section.tsx` (#fiyatlar).
>
> **Revizyon (9 Tem):** kullanıcı kararıyla 3 katman (Free/Pro/Premium)
> 2 katmana indi — **Ücretsiz + Pro ₺2.000/ay (yıllık ₺20.000, 2 ay
> hediye), tüm özellikler Pro'da.** Basitlik > segmentasyon: tek karar,
> tek fiyat, satış görüşmesinde açıklaması 10 saniye.

## 1. Temel karar: ofis başına fiyat (per-seat DEĞİL)

Kullanıcı tespiti doğru: Türkiye pazarında danışman başına fiyat, tek
hesabın paylaşılmasıyla delinir. Bunu kural koyarak değil, **teşvikle**
çözüyoruz:

- **Fiyat ofis başına** → paylaşacak bir şey yok, suçluluk oyunu yok.
- **Pro'da sınırsız kullanıcı** → herkese hesap açmak bedava; "ofis
  başına tek fiyat" vaadinin görünür kanıtı.
- **Ürün içi doğal teşvik:** kazanç paylaşımı, performans takibi ve
  ajanda kişi bazlı çalışır. Tek hesaptan yürüten ofis, ürünün en değerli
  özelliklerini kendi eliyle kapatmış olur. Çakallık kendini cezalandırır.
- Free'de 1 kullanıcı + 3 ilan: gerçek bir ofis free'de yaşayamaz;
  yükseltme baskısı limitten değil, ihtiyaçtan gelir.

## 2. Paket yapısı (güncel)

| | Başlangıç (₺0) | Pro (₺2.000/ay · ₺20.000/yıl) |
|---|---|---|
| İlan | 3 | Sınırsız |
| Kullanıcı | 1 | Sınırsız |
| CRM (kişi + kanban) | ✓ | ✓ |
| Vitrin | ✓ (EmlakFlow rozetli) | ✓ rozetsiz + logo/marka rengi |
| Eşleştirme, ajanda, sohbet, kira, kontrat, komisyon | — | ✓ |
| AI (ilan metni, SEO, fiyat danışmanı) | — | ✓ |
| Mülk sahibi raporu, funnel analitiği, sosyal senkron | — | ✓ |
| Destek | Topluluk | Öncelikli |

Free'deki vitrin rozeti bilinçli: growth loop (bkz. seo-buyume-plani
§A3-3) + yükseltme nedeni.

## 3. Fiyat gerekçesi

- **₺2.000/ay:** yuvarlak, hatırlanır, pazarlıkta konuşması kolay.
  Türkiye emlak yazılımı pazarında ofis başına aylık paketler kabaca
  ₺800–₺3.000 bandında (2026) — üst-orta konum, "tüm özellikler dahil"
  vaadiyle tutarlı. Satış çerçevesi: *tek satışın komisyonunun küçük bir
  yüzdesi, yılın tüm aboneliğini öder.*
- **Yıllık ₺20.000 = 10 × aylık (2 ay hediye):** nakit akışını öne
  çeker, churn'ü kilitler; enflasyon ortamında yıllık peşin cazip, fiyat
  güncellemesi yıllık müşteriyi dönem sonuna kadar korur.
- **KDV hariç** (B2B standardı).
- ⚠️ Rakamlar hipotez: ilk 20 satış görüşmesi fiyat testidir. İtiraz
  "neye yarıyor" ise fiyat doğru; "pahalı" ise önce paket anlatımını
  düzelt, sonra fiyatı düşün.

## 4. Teknik durum

Yapıldı:
- `lib/plans.ts`: PLANS (free/pro), `planKeyFromTenant`; `isPro` eski
  "premium" değerini de pro sayar (legacy güvenlik).
- Admin panel: Free/Pro seçici (AdminPlanToggle).
- Landing #fiyatlar bölümü (2 kart) + nav linki; SoftwareApplication
  JSON-LD AggregateOffer (0–2000 TRY, offerCount 2).

Sonraki fazlar (sırayla):
1. **Kullanıcı limiti zorlaması:** ekip davetinde free=1 kontrolü.
2. **Ödeme:** iyzico abonelik (TR kartları + taksit) veya Stripe.
   O gelene kadar satış akışı: kayıt (trial) → admin panelden manuel
   plan atama + PlanChangeLog. İlk müşteriler için yeterli.
3. **Trial kurgusu:** yeni kayıt "trial" 14 gün Pro yetkili sayılsın
   (proExpiresAt altyapısı hazır) — ürünün en iyi hâli ilk hafta
   gösterilmeli. Billing ile birlikte açılır.
