# EmlakFlow Fiyatlandırma Çalışması

> Temmuz 2026. Fiyat/limit tek kaynağı: `lib/plans.ts` PLANS sabiti.
> Landing bölümü: `components/landing/pricing-section.tsx` (#fiyatlar).

## 1. Temel karar: ofis başına fiyat (per-seat DEĞİL)

Kullanıcı tespiti doğru: Türkiye pazarında danışman başına fiyat, tek
hesabın paylaşılmasıyla delinir. Bunu kural koyarak değil, **teşvikle**
çözüyoruz:

- **Fiyat ofis başına** → paylaşacak bir şey yok, suçluluk oyunu yok.
- **Kullanıcı hakkı cömert** (Pro 10, Premium sınırsız) → herkese hesap
  açmak bedava; kısıtlamak için değil, düzen için var.
- **Ürün içi doğal teşvik:** kazanç paylaşımı, performans takibi ve
  ajanda kişi bazlı çalışır. Tek hesaptan yürüten ofis, ürünün en değerli
  özelliklerini kendi eliyle kapatmış olur. Çakallık kendini cezalandırır.
- Free'de 1 kullanıcı + 3 ilan: gerçek bir ofis free'de yaşayamaz;
  yükseltme baskısı limitten değil, ihtiyaçtan gelir.

## 2. Paket mimarisi

| | Başlangıç (₺0) | Pro (₺1.490/ay) | Premium (₺2.990/ay) |
|---|---|---|---|
| İlan | 3 | Sınırsız | Sınırsız |
| Kullanıcı | 1 | 10 | Sınırsız |
| CRM (kişi+kanban) | ✓ | ✓ | ✓ |
| Vitrin | ✓ (rozetli) | ✓ rozetsiz + marka | ✓ rozetsiz + marka |
| Eşleştirme, ajanda, sohbet, kira, kontrat, komisyon | — | ✓ | ✓ |
| AI paketi (ilan metni, SEO, fiyat danışmanı) | — | — | ✓ |
| Mülk sahibi raporu, funnel analitiği, sosyal senkron, çevre skoru | — | — | ✓ |
| Destek | Topluluk | Standart | Öncelikli |

Katman mantığı:
- **Pro = işletim sistemi.** Ofisin günlük çalışması için gereken her şey.
  "Tüm özellikler Pro'da" isteği burada karşılanır.
- **Premium = para kazandıran katman.** AI ve analitik özellikleri
  maliyetli (OpenAI) VE değeri ölçülebilir (rapor, funnel) — ayrı
  katmana koymak hem marjı korur hem "neden 2x fiyat?" sorusunu
  kendiliğinden cevaplar.
- Free'deki vitrin rozeti bilinçli: growth loop (bkz. seo-buyume-plani
  §A3-3) + yükseltme nedeni.

## 3. Fiyat noktaları ve gerekçe

- **₺1.490 Pro:** Türkiye emlak yazılımı pazarında ofis başına aylık
  paketler kabaca ₺800–₺3.000 bandında (2026). 1.490, "portal üyeliğinden
  ucuz, Excel'den değerli" konumu. Tek satışın komisyonu onlarca aylık
  aboneliğe bedel — landing'de bu çerçeve kullanılmalı.
- **₺2.990 Premium = 2×Pro:** basit çarpan, karar kolaylığı. AI maliyeti
  değişkense bile marj korunur.
- **Yıllık = 10× aylık (2 ay hediye):** nakit akışı öne çeker, churn'ü
  kilitler. Türkiye'de enflasyon ortamında yıllık peşinat cazibesi yüksek;
  fiyat güncellemesi yıllık müşteriyi dönem sonuna kadar korur.
- **KDV hariç** yazıyoruz (B2B standardı).
- ⚠️ Bu rakamlar hipotezdir. İlk 20 gerçek satış görüşmesi fiyat testidir:
  itiraz "pahalı" değil "neye yarıyor" ise fiyat doğru, "pahalı" ise önce
  paket anlatımını düzelt, sonra fiyatı düşün.

## 4. Teknik durum

Yapıldı (bu commit):
- `lib/plans.ts`: PLANS sabiti, `planKeyFromTenant`, `isPremium`;
  `isPro` artık premium'u da kapsıyor (mevcut tüm ilan-limiti kapıları
  otomatik doğru çalışır).
- Admin panel: plan seçici free/pro/premium (AdminPlanToggle) +
  ALLOWED_PLANS'a premium.
- Landing #fiyatlar bölümü + nav linki; SoftwareApplication JSON-LD
  AggregateOffer (0–2990 TRY).

Sonraki fazlar (sırayla):
1. **Premium kapıları:** `isPremium()` ile AI uçları
   (/api/ai/generate-listing, price-advice), /analitik, owner-report ve
   sosyal senkronu kapat; Pro kullanıcıya kilit yerine "Premium'a geç"
   üst-satış ekranı göster (kapatma değil, tanıtım fırsatı).
2. **Kullanıcı limiti zorlaması:** ekip davetinde plan kontrolü
   (free=1, pro=10).
3. **Ödeme:** iyzico abonelik (TR kartları + taksit) veya Stripe.
   O gelene kadar satış akışı: kayıt (trial) → admin panelden manuel
   plan atama + PlanChangeLog. İlk müşteriler için yeterli.
4. **Trial kurgusu:** yeni kayıt "trial" 14 gün Premium yetkili sayılsın
   (proExpiresAt altyapısı hazır) — ürünün en iyi hâli ilk hafta
   gösterilmeli. Billing ile birlikte açılır.
