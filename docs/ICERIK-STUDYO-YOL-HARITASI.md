# EmlakFlow — İçerik & Stüdyo Yol Haritası (Şablon Omurgası)

> Temmuz 2026. Kapsam: **(1) AI foto iyileştirme (before/after)** + **(2) Sosyal OS**
> geliştirmeleri, tek bir fikirde birleştirilerek: **Şablon → aynısını tutarlı üret →
> planla/yayınla.** Blueprint: `docs/AI-SOCIAL-MEDIA-OS.md` (Sosyal OS tek kaynağı).
> Bu doküman "nasıl en uygun yolla yaparız"ın stratejisi + fazlaması.

---

## 0. Birleştirici fikir — "Şablon" tek omurga

Kullanıcının istediği şey aslında tek bir kavram: **markaya kilitli, yeniden üretilebilir tarif = Şablon.**

- Bir şablon **bir kez seçilir/oluşturulur** → sistem **aynı görünümü/tonu** her ilana,
  her fotoğrafa, her güne **tekrar üretir**. "Aynısını üret" = kopyala-yapıştır değil,
  **aynı reçeteyle yeni içerik**.
- **Foto iyileştirme** ve **sosyal içerik** aynı şablon omurgasını paylaşmalı — iki ayrı
  silo kurma. Tek `Template` modeli, tür alanıyla: `PHOTO_ENHANCE | POST | REEL | STORY | CAROUSEL`.
- Tutarlılığın kaynağı = **Şablon + Marka Kiti (BrandKit) + İlan bağlamı** → yapılandırılmış çıktı
  (blueprint'teki "structured output contract"). Marka Kiti değişince şablon çıktısı da değişir.

**Stratejik bahis (blueprint'ten):** Rakipler "post zamanla" satar. Biz **envanter-farkında,
markaya sadık, tek-tık tekrar üretim** satıyoruz. Fark = Şablon + Envanter grafiği + Kredi ekonomisi.

---

## 1. Mevcut durum (ne var, sıfırdan değil)

| Parça | Durum | Dosya |
|---|---|---|
| **Before/after foto iyileştirme** | ✅ Var | `components/studio-{before-after,photo-tab,workspace}.tsx`, `app/actions/studio.ts`, `lib/studio-{prompts,templates}.ts` |
| AI video (Veo/Shotstack) + seslendirme + müzik | ✅ Güçlü | `lib/{shotstack,vertex-veo,studio-music}.ts` |
| **Sosyal OS MVP** | ✅ Başlandı (paralel oturum) | `/sosyal`, `BrandKit`, `ContentAsset`, `CalendarItem`, AI planlayıcı, takvim kuyruğu |
| Meta IG/FB OAuth + insight | 🟡 Kısmi | `lib/social.ts`, `app/api/social/*` |
| Kredi ekonomisi | ✅ | `lib/plans.ts` `STUDIO_ALLOTMENT`, `CREDIT_TOPUP_PACKS` |
| Generation pipeline / Marketing Brain | ⛔ Blueprint'te tanımlı, tam bağlanmadı | `docs/AI-SOCIAL-MEDIA-OS.md` §14 |
| Şablon kütüphanesi (paylaşımlı) | ⛔ Dağınık (studio-templates ayrı, sosyal ayrı) | — |
| Planlayıcı (DnD takvim) · Onay akışı · LinkedIn/TikTok · Rakip AI | ⛔ | Build |

---

## 2. Faz planı (öncelik sırası + neden)

### Faz 1 — Şablon omurgası (temel taş)
Tek `Template` modeli (tenant'a ait + sistem hazır şablonları). Alanlar: `kind`,
`name`, `brandLocked` (marka kitini uygular), `recipe` (Json: prompt/işlem/parametre),
`preview`, `credits`. Hem foto hem sosyal bunu kullanır.
- **Neden önce:** "aynısını üret / planla" bunun üstüne kurulur; iki siloyu birleştirir.
- Marka Kiti (`BrandKit`) ile bağ: renk, logo, font, ton, yasaklı ifadeler, sessiz saatler.

### Faz 2 — Before/after foto iyileştirme (şablon-tabanlı, kredi geliri)
Mevcut before/after'ı **hazır şablonlara** oturt:
- Hazır şablonlar: *Işık & renk düzelt · Gökyüzü değiştir · Sanal dekor (staging) ·
  Dağınıklık gider · Cephe/çim yeşert · Marka watermark.*
- **Toplu işleme:** bir ilanın TÜM fotoğraflarına tek şablonla aynı stil (tutarlılık).
- Before/after slider (var) + "bu şablonu kaydet / tekrar kullan".
- **Neden erken:** anında değer + **kredi harcatır (gelir)**; teknik olarak en hazır olanı.

### Faz 3 — Sosyal generation pipeline'ı şablona bağla + "aynısını üret"
Blueprint §14 pipeline'ını (Strateji → Kopya → Tasarım → Video → SEO → Sosyal Mgr)
şablonlara bağla; çıktı = yapılandırılmış `ContentAsset`.
- **"İlandan üret":** Portföy → "Sosyal'e Gönder" → seçilen şablon(lar)la içerik.
- **"Aynısını üret / Çoğalt":** bir şablon setini **N ilana** veya **30 güne** uygula (batch).
- Marketing Brain (tenant strateji JSON, 7 gün cache) tonu/temayı sabitler.

### Faz 4 — Planla & yayınla
- **Akıllı planlayıcı:** DnD takvim (`@dnd-kit` var) + en iyi saat önerisi.
- **Onay akışı:** Pazarlama → Broker → Sahip (plan-gated; Free/Pro insan-döngüde, Premium auto).
- **Auto-publish:** Meta (IG/FB) önce; TikTok/LinkedIn manuel kuyruk → sonra API.
- QStash ile async, idempotent `publishAttemptId`, guardrail'lar (sessiz saat, günlük limit).

### Faz 5 — Ölç & iyileştir
- Erişim → profil ziyareti → **vitrin lead'i** (`utm_source=social` → `Lead`/`Contact`).
- "En iyi post → şablonu güçlendir" döngüsü. Rakip AI (sonraya).

---

## 3. Mimari kararlar (öneri)

- **Tek `Template` modeli** (tür alanlı) — foto + sosyal ortak. Sistem hazır şablonları
  seed'lenir; kullanıcı kendi şablonunu kaydeder ("aynısını üret"in kaynağı).
- **Tutarlılık reçetesi:** Şablon `recipe` (sabit prompt/işlem) + BrandKit + ilan verisi →
  aynı görünüm. Görselde tutarlılık için sabit stil parametreleri (ve mümkünse sabit seed).
- **Batch/çoğaltma:** "bir şablon → çok çıktı" işleri **kuyruğa** (QStash/cron), krediyle,
  ilerleme göstergeli.
- **Kredi:** her üretim `STUDIO_ALLOTMENT`/`CREDIT_TOPUP_PACKS`'e bağlı; landing'de "kredi"
  dili zaten var, Stüdyo'da fiyat gösterilir.
- **İnsan-döngüde:** varsayılan onay; Premium'da otomasyon. Yasaklı ifade/lisans denetimi.

---

## 4. Düşüncelerim / riskler

- **En yüksek getiri → Faz 2 (before/after) erken bitir:** hazır, görünür, kredi harcatır.
  Ama önce Faz 1 şablon modelini koy ki foto şablonları da omurgaya otursun.
- **Asıl moat → Faz 3'teki "aynısını üret / çoğalt".** Rakiplerde yok. "1 ilan → 30 gün
  markaya sadık içerik" tek-tık. Buraya yaslan.
- **AI maliyet/kota:** geçmişte OpenAI kotası doldu — üretim pipeline'ı **deterministik
  fallback** + kredi tavanı + kuyruk ile korunmalı (foto/rapor'da yaptığımız desen).
- **"Aynısı" ≠ "tıpatıp":** tutarlı görünüm + yeterli varyasyon dengesi; şablon sabit reçete,
  içerik ilana göre değişir. Aşırı tekrar = sosyal medyada ceza.
- **Meta API sınırları:** yayın kotaları/izinleri; auto-publish plan-gated + manuel kuyruk yedeği.
- **Silo riski:** foto ve sosyal şablonlarını AYRI kurarsak teknik borç. Faz 1 bunu engeller.

---

## 5. Önerilen ilk hamle

**Faz 1 (Şablon modeli) + Faz 2 (before/after şablonları)** birlikte: omurgayı kur, ilk
somut değeri (kredi harcatan foto iyileştirme şablonları + toplu işleme) çıkar. Sonra Faz 3'te
"aynısını üret / 30 güne çoğalt" ile Sosyal OS'i asıl farklılaştırıcıya taşı.
