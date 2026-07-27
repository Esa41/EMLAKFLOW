# Sosyal OS — Ne Var, Ne Yok, Nasıl Tamamlanır

> Temmuz 2026. Ekrandaki Planlayıcı'nın kod seviyesinde incelemesi.
> Okunanlar: `components/social/planner-panel.tsx`, `app/actions/social-os.ts`,
> `lib/social-os/{generate,prompts,catalog}.ts`, `lib/social.ts`,
> `app/api/social/*`, `app/api/cron/social-sync`.

---

## 1. Şu an gerçekten ne yapıyor

Ekranda gördüğünüz akış: **ilan seç → paket (veya format+ton) seç → üret**.

Üretim tek bir LLM çağrısı: `gpt-4o-mini`, `temperature 0.7`, çıktı JSON.
Dönen içerik zengin:

| Alan | Ne işe yarar |
|---|---|
| `headline`, `caption`, `cta` | Gönderi metni (Türkçe) |
| `hashtags`, `seoKeywords` | Etiket ve arama kelimeleri |
| `carouselSlides[]` | Karusel slayt metinleri + görsel tarifi |
| `storySequence[]` | Story kareleri + saniye süreleri |
| `imagePrompt{5 varyant}` | Midjourney / Flux / Imagen / GPT-Image / Ideogram promptları (İngilizce) |
| `videoPrompt`, `thumbnailIdea` | Video ve kapak fikri |
| `postingRecommendation` | Hangi platform, hangi saat, neden |

Sonuç `ContentAsset` olarak **DRAFT** kaydedilir. "Planla" dediğinizde bir
`CalendarItem` satırı **QUEUED** durumuyla oluşur.

Marka Kiti (ses, yasak ifadeler, emoji politikası) prompt'a gerçekten
enjekte ediliyor — bu kısım çalışıyor ve değerli.

---

## 2. Ne YAPMIYOR — vaadin karşılanmayan kısmı

Sayfanın başlığı: **"İlandan içeriğe — üret, planla, yayınla, ölç."**

| Vaat | Durum |
|---|---|
| Üret | ✅ Çalışıyor |
| Planla | ⚠️ Yarım — takvime satır yazıyor, o kadar |
| **Yayınla** | ❌ **Yok** |
| Ölç | ⚠️ Var ama **kopuk** |

### 2.1 "Yayınla" hiç kurulmamış — üç ayrı kanıt

1. **`QUEUED` satırlarını okuyan hiçbir şey yok.** Tüm kod tabanında `QUEUED`
   yalnız iki yerde geçiyor: yazıldığı yer (`social-os.ts:221`) ve hub'da
   sayıldığı yer (`sosyal/page.tsx:20`). Kuyruğu işleyen cron/worker yok.
2. **`lib/social.ts` içinde yayın fonksiyonu yok.** Sadece OAuth + okuma var:
   `metaAuthUrl`, `exchangeMetaCode`, `findInstagramAccount`,
   `fetchInstagramMedia`, `fetchMediaInsights`. Instagram'ın yayın akışı
   (`POST /media` → `POST /media_publish`) hiç yazılmamış.
3. **OAuth izinleri yayına kapalı.** İstenen scope'lar: `instagram_basic`,
   `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`.
   Yayın için şart olan **`instagram_content_publish` istenmiyor** — yani
   kullanıcı hesabını bağlasa bile token yayın yapamaz.

**Sonuç:** Takvime koyduğunuz içerik, planlanan saatte hiçbir yere gitmez.
Sessizce `QUEUED` olarak durur.

### 2.2 Ölçüm çalışıyor ama başka bir veriyi ölçüyor

`social-sync` cron'u gecelik Instagram metriklerini çekiyor — ama yalnız
`SocialPost` tablosunda `externalId` dolu olan kayıtlar için. `SocialPost`
kayıtları ise **elle** oluşuyor (yayınladığınız gönderinin linkini yapıştırarak).

AI'ın ürettiği `ContentAsset` hiçbir zaman `SocialPost`'a dönüşmüyor.
Yani sistem **ürettiğini ölçmüyor, ölçtüğünü üretmemiş.** Döngü kapalı değil.

### 2.3 Görseli kim üretecek?

Instagram'da gönderi = görsel. Planlayıcı 5 ayrı görsel promptu üretiyor —
ama bunlar **entegre olmadığımız harici araçlara** (Midjourney, Ideogram…)
yapıştırılmak için. Kullanıcı metni alıyor, görseli başka yerde, çoğu zaman
ayrı ücretli bir araçta üretmek zorunda.

Oysa AI Stüdyo'da zaten Fal.ai üzerinden foto iyileştirme ve video üretimi
var. Prompt üretip dışarı göndermek yerine **Stüdyo'ya bağlamak** doğru yol.

---

## 3. Maliyet — token/API

### 3.1 Ölçüm

- Sistem promptu: ~1.285 karakter ≈ **~400 token** (JSON kontratı dahil)
- İlan verisi (girdi): ~200–400 token
- Çıktı: şema geniş (5 görsel promptu + karusel + story) ≈ **900–1.600 token**

`gpt-4o-mini` birim fiyatlarıyla (girdi $0,15 / çıktı $0,60 per 1M —
*yayına almadan önce sağlayıcının güncel fiyat sayfasından teyit edin*):

| | Token | Maliyet |
|---|---|---|
| Girdi | ~700 | $0,0001 |
| Çıktı | ~1.200 | $0,0007 |
| **Üretim başına** | | **≈ $0,0008** |

**1.000 üretim ≈ $0,80.** 100 ofis × ayda 30 üretim = 3.000 çağrı ≈ **$2,5/ay.**

### 3.2 Yorum: para sorun değil, iki başka şey sorun

**a) Asıl maliyet gecikme.** 1.200 token çıktı `gpt-4o-mini`'de ~5–12 saniye.
Kullanıcı butona basıp bekliyor. Çıktının yaklaşık %40'ı **her seferinde
üretilen 5 ayrı görsel promptu** — kullanıcı en fazla birini kullanacak.
Şemayı kırpmak bekleme süresini neredeyse yarıya indirir.

**b) Hiç kota yok.** `generateSocialAsset` içinde kredi/limit kontrolü **yok**
(Stüdyo'da kredi sistemi varken burada yok). Bir kullanıcı döngüye sokup
sınırsız çağrı yapabilir. Tutar küçük olduğu için acil değil ama açık kapı.

### 3.3 Kırılganlık

`generateText` + elle `JSON.parse`. Kod markdown çitlerini regex'le sıyırıp
parse ediyor, hata olursa "AI yanıtı JSON olarak ayrıştırılamadı" fırlatıyor.
`temperature: 0.7` ile bu ara sıra **gerçekten olur** ve kullanıcı emeğini
kaybeder. AI SDK'nın `generateObject` + Zod şeması bu hata sınıfını tamamen
ortadan kaldırır.

---

## 4. UI/UX — ekrandaki iki sorun

### 4.1 Aynı seçim iki kez sorulıyor
Ekran görüntülerinde net: önce **"Ne tür içerik?"** paketleri (Yeni ilan
duyurusu / Özellik karuseli / Lüks reel…), hemen altında **Format** listesi
(Tek gönderi / Karusel / Story…), altında **Ton** listesi.

Paket zaten format+ton'u ayarlıyor. Metin de bunu söylüyor: *"format ve ton
otomatik ayarlanır. İstersen aşağıdan ince ayar yap."* — ama "ince ayar"
kapalı değil, tamamı açık duruyor. Kullanıcı aynı kararı iki kez veriyor,
hangisinin kazandığını anlamıyor.

**Çözüm:** Format+Ton'u `<details>` içine al, başlığı "İnce ayar (isteğe
bağlı)". Paket seçimi tek karar olarak kalsın.

### 4.2 Sonucun neye benzeyeceği görünmüyor
Panel metin üretiyor ama **gönderi önizlemesi yok**. Emlakçı Instagram
kutusunda nasıl duracağını göremiyor. Karusel slaytları düz liste olarak
geliyor.

---

## 5. Plan — sırayla ne yapılmalı

### Faz A — Vaadi dürüstleştir (bugün, yarım gün)
1. Başlıktan "yayınla" iddiasını kaldır ya da **"yayına hazırla"** yap.
2. Takvim ekranında QUEUED satırlara net etiket: *"Hatırlatma — yayını siz
   yapacaksınız"*. Sessiz kuyruk, kullanıcının güvenini yiyor.

> Bu madde küçük ama en acili: şu an ürün yapmadığı bir şeyi vaat ediyor.

### Faz B — "Destekli yayın" (1–2 gün, Meta onayı GEREKTİRMEZ)
Gerçek otomatik yayın Meta App Review'a bağlı ve süre sizin elinizde değil.
Değerin çoğunu onaysız vermek mümkün:

- Planlanan saatte **bildirim** (panel + e-posta): "Kartepe 5+1 gönderisi
  şimdi paylaşılmalı"
- Bildirimde **caption tek tıkla panoya**, medya tek tıkla indir
- Kullanıcı Instagram'a yapıştırır, sonra **"Yayınladım + link"** der
- O link `SocialPost` olarak kaydedilir → **mevcut insights cron'u devreye
  girer** → döngü kapanır

Bu, 2.2'deki kopukluğu da çözer ve tek satır Meta izni gerektirmez.

### Faz C — Şema ve dayanıklılık (yarım gün)
- `generateText` + `JSON.parse` → **`generateObject` + Zod**
- 5 görsel promptu → **1** (veya kullanıcı istediğinde). Gecikme ~%40 düşer
- Tenant başına günlük üretim kotası (Stüdyo kredi modeliyle hizalı)

### Faz D — Görseli Stüdyo'ya bağla (2–3 gün)
`imagePrompt` çıktısını dışarı vermek yerine **mevcut Fal.ai hattına** gönder:
"Bu karusel için görselleri üret" → Stüdyo işi → medya `ContentAsset`'e bağlanır.
Ürün o zaman gerçekten "otomatik pazarlama" olur; şu an "prompt yazarı".

### Faz E — Gerçek otomatik yayın (Meta onayına bağlı, takvim belirsiz)
Gerekenler:
- Scope ekle: `instagram_content_publish` (+ sayfa gönderisi için
  `pages_manage_posts`)
- **Meta App Review + işletme doğrulama** — haftalar sürebilir, dış bağımlılık
- `POST /media` → `POST /media_publish` akışını yaz
- QUEUED kuyruğunu işleyen cron + tekrar deneme + hata durumu
- **Instagram limiti: hesap başına 24 saatte 25 gönderi** — kuyruk bunu bilmeli
- Medyanın herkese açık URL'den erişilebilir olması şart (R2 uygun)

---

## 6. Özet cevap: "tam anlamıyla iş yapacak mı?"

**Bugünkü hâliyle hayır — ama sandığınızdan az iş kalmış.**

Zor kısım (ilan verisinden marka sesine uygun, platforma özel içerik üretmek)
çalışıyor ve iyi çalışıyor. Eksik olan, üretilenle dış dünya arasındaki
köprü: yayın ve ölçüm.

**Maliyet endişesi yersiz** — üretim başına ~$0,0008. Sınır para değil,
gecikme ve kota yokluğu.

En yüksek getirili tek hamle **Faz B**: Meta onayı beklemeden döngüyü
kapatır, ürünü "içerik üreticisi"nden "sosyal medya işletim sistemi"ne
taşır.
