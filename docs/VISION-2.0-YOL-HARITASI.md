# EmlakFlow — Vision 2.0 Uygulama Yol Haritası

> Temmuz 2026. Bu doküman, "Real Estate OS" vizyonunu **mevcut kod tabanıyla**
> hizalar. Her vizyon başlığı `var / kısmen / yok` olarak, dayandığı gerçek
> dosya/model ile işaretlenmiştir. Amaç sıfırdan inşa değil, **gerçek boşlukları**
> öncelikli ve mevcut işlevi bozmadan kapatmaktır.
>
> İlgili tekil kaynaklar: dikey/etiketler `lib/verticals.ts`, navigasyon
> `components/nav-items.ts`, veri modeli `prisma/schema.prisma`, planlar
> `lib/plans.ts`.
>
> **Kapsam kararı (Tem 2026):** İnşaat & Proje Satış dikeyi **pasif/ertelendi**.
> Odak mevcut emlak/ofis/müşteri-portalı ürününü premium ve yapışkan hale getirmek.
> Sıra: P0 premium his → P1 AI copilot → P2 CRM döngüleri → P3 büyüme → P4 belge.

---

## Yönetici Özeti

EmlakFlow bugün "başka bir CRM" değil; **çok kiracılı (multi-tenant), dikey-farkında
(REAL_ESTATE / AUTO_DEALER / MULTI) olgun bir SaaS**. Vizyon dokümanının
"inşa edilecek" saydığı işlevlerin çoğu **zaten yayında**: ilan/portföy, Kanban
satış hattı, kişi CRM'i + AI içgörüleri, kiralama, AI Stüdyo (video üretimi dahil),
analitik, finans/prim, ekip, bildirim+faaliyet merkezi, sosyal medya, akıllı eşleştirme,
kamuya açık ofis vitrini ve müşteri portalı temeli.

Vizyona kıyasla **stratejik ağırlıklı 5 gerçek boşluk** var:

1. **İnşaat Firması dikeyi tamamen yok** — en büyük eksik, sıfır kod.
2. **Proje Satış + İnteraktif Envanter Haritası yok** — birim durum haritası yok.
3. **Komut paleti (⌘K) yok** — "Arc/Linear hissi"nin en ucuz teslimatı.
4. **Global AI Copilot dağınık** — her ekranda değil, Stüdyo/Sohbet/İçgörü'de siloda.
5. **İletişim derinliği sığ** — WhatsApp link-out düzeyinde; SMS, arama kaydı,
   takvim çift-yön senkron, e-imza yok.

---

## A. Mevcut Durum Envanteri (vizyon → gerçek)

Durum kodları: ✅ var · 🟡 kısmen · ⛔ yok

### Bireysel Danışman + Ofis ihtiyaçları
| Vizyon | Durum | Dayanak |
|---|---|---|
| Portföy / İlanlar | ✅ | `app/(app)/portfoy`, `Listing`+`ListingMedia` |
| Müşteri/Lead CRM | ✅ | `app/(app)/kisiler`, `Contact`, `Lead` |
| Satış hattı (Kanban, drag-drop) | ✅ | `components/kanban-board.tsx`, `deal-drawer.tsx`, `Deal`/`DealStage` |
| Takvim / Ajanda | ✅ | `app/(app)/ajanda`, `Appointment` |
| Görevler | ✅ | `Task` modeli, `components/agenda-hub.tsx` (ajanda içine gömülü) |
| AI Asistan | 🟡 | Stüdyo + Vitrin Sohbet + İçgörü var; **global copilot yok** |
| Ekip / çalışan yönetimi | ✅ | `app/(app)/ekip`, `User`+`Role` |
| Prim / komisyon | ✅ | `app/(app)/finans`, `Commission`, `lib/commission.ts` |
| Rol / yetki | ✅ | `Role` enum, `lib/permissions.ts` |
| Ofis analitiği | ✅ | `app/(app)/analitik`, `ListingDailyStat`, `Insight` |
| Şube yönetimi | ⛔ | Tek `Tenant` düzeyi; şube (branch) hiyerarşisi yok |

### Portföy / Property Management
| Vizyon | Durum | Dayanak |
|---|---|---|
| Galeri / medya | ✅ | `ListingMedia`, `components/listing-gallery.tsx` |
| Harita | 🟡 | `mapbox`/`leaflet`, `parsel-map.tsx` (parsel düzeyi) |
| Fiyat geçmişi / zaman çizelgesi | ✅ | `ListingEvent`, `ListingDailyStat` |
| AI analiz / açıklama üretimi | ✅ | `app/api/ai`, `lib/seo-ai.ts` |
| Foto iyileştirme / AI staging / gökyüzü | ✅ | AI Stüdyo (`app/api/studio`, `StudioJob`) |
| Otomatik watermark | 🟡 | `lib/images.ts` (doğrula) |
| Duplicate tespiti | ⛔ | Yok |
| QR kod / sanal tur | ⛔ | Yok |
| Belge kasası (vault) + versiyon | 🟡 | `Contract` var; versiyonlu belge kasası yok |

### İletişim Merkezi
| Vizyon | Durum | Dayanak |
|---|---|---|
| E-posta | ✅ | `lib/mailer.ts`, `lib/marketing-mailer.ts`, `EmailLog` |
| WhatsApp | 🟡 | `wa.me` link-out (kişi sayfası); entegre gelen kutusu/kayıt yok |
| SMS | ⛔ | Sağlayıcı (Netgsm/Twilio) yok |
| Telefon / arama kaydı | ⛔ | `call log` yok |
| Şablonlar | ✅ | `lib/mail-compose-templates.ts`, `docs/mail-templates` |
| AI yanıt üretimi | 🟡 | `app/api/chat` var; her kanala yayılmamış |
| Toplantı özeti / ses notu | ⛔ | AI seslendirme (`studio-voice`) var ama **sesle giriş yok** |

### Finans / Analitik / Admin
| Vizyon | Durum | Dayanak |
|---|---|---|
| Komisyon / kasa / gelir-gider | ✅ | `Commission`, `CashEntry`, `app/(app)/finans` |
| Nakit akışı / karlılık | ✅ | `lib/report.ts`, `app/api/reports` |
| Executive dashboard / tahmin | 🟡 | Analitik var; AI tahmin/forecast sınırlı |
| Kullanıcı / rol / audit log | 🟡 | `Activity` var; ayrı denetim (audit) görünümü zayıf |
| Entegrasyonlar / Open API | ⛔ | Public API yok (marketplace mimarisi kurulmamış) |

### Müşteri Portalı / Vitrin
| Vizyon | Durum | Dayanak |
|---|---|---|
| Kamuya açık ofis vitrini | ✅ | `app/ofis/[slug]`, `lib/showcase-*` |
| Müşteri giriş + favoriler | ✅ | `app/ofis/[slug]/favorilerim`, `SiteUser`, `Favorite`, `lib/site-auth.ts` |
| Randevu talebi / teklif takibi (portal) | 🟡 | Vitrin sohbet var; portal içi randevu/teklif akışı zayıf |
| Sosyal medya otomasyonu | ✅ | `app/api/social`, `SocialPost`, `SocialPostMetric` |
| AI medya (video/staging) | ✅ | AI Stüdyo, Shotstack/Veo (`lib/shotstack.ts`, `lib/vertex-veo.ts`) |

### İnşaat & Proje Satış (vizyonun ağır bölümü)
| Vizyon | Durum | Dayanak |
|---|---|---|
| İnşaat dikeyi (`CONSTRUCTION`) | ⛔ | `Vertical` enum: sadece REAL_ESTATE/AUTO_DEALER/MULTI |
| Proje / Blok / Kat / Daire modeli | ⛔ | Hiçbir model yok |
| İnşaat ilerleme / teslim / garanti | ⛔ | Yok |
| Ödeme planı / taksit / tahsilat | 🟡 | Kira için `RentPayment` var; proje taksiti yok |
| İnteraktif envanter/bina haritası | ⛔ | Birim durumu (Boş/Rezerv/Satıldı/Bloke/Bakım) yok |
| Proje bazlı satış hunisi / kampanya | ⛔ | Genel `Deal` hattı var, proje bağlamı yok |

---

## B. UX & Karmaşıklık Sorunları

1. **13 düz navigasyon öğesi, gruplanmamış.** Vizyonun "modüler, minimal, yalnızca
   ilgili modülleri göster" ilkesiyle çelişir. `merkez` (bildirim+faaliyet birleşimi)
   doğru içgüdü; kalanı **Çalışma / Büyüme / Yönetim** gibi gruplara ayrılmalı ve
   dikeye göre gizlenmeli. Kaynak: `components/nav-items.ts`.
2. **Rota/etiket çakışması.** `/musteriler` rotası *satış hattını* render ederken,
   "Müşteriler" etiketli menü öğesi `/kisiler`'e (kişiler) gider. Kullanıcıya görünen
   etiketler tutarlı ama rota adlandırması bakım tuzağı — yeni geliştirici için kafa
   karıştırıcı.
3. **Global copilot / komut paleti yok.** Vizyon defalarca "her ekranda asistan" ve
   Arc/Linear klavye hissi istiyor; ⌘K yok. En yüksek algı/maliyet oranlı eksik.
4. **Paylaşılan boş-durum / iskelet (skeleton) sistemi belirsiz.** Vizyon açıkça
   "excellent empty states + skeleton loading" istiyor; ortak primitif teyide muhtaç.
5. **İnşaat dikeyi için dikey-farkında altyapı hazır ama kullanılmıyor** —
   `getVertical()` deseni var; yeni dikey eklemek mimariyle uyumlu, riski düşük.

---

## C. Fazlı Yol Haritası

Her faz "mevcut işlevi bozmama" ilkesine tabidir: değişiklikler **katmanlı/eklemeli**,
şema değişimleri geriye dönük uyumlu, dikeye özel özellikler `getVertical()` arkasında.

### P0 — Premium his (düşük risk, eklemeli) · ~1 hafta
- **Komut paleti (⌘K)**: global arama (ilan/kişi/lead/randevu) + hızlı aksiyon
  (yeni ilan, yeni lead, ara). Kütüphane: `cmdk`. Yalnızca yeni bir bileşen +
  `app/(app)/layout.tsx`'e portal; hiçbir rota/model değişmez.
- **Navigasyon gruplaması + dikey gating**: `nav-items.ts` içinde `group` alanı,
  `sidebar.tsx`/`mobile-nav.tsx` render güncellemesi. Rota adı değişmez (çakışmayı
  görsel etiketle netleştir, yeniden adlandırma P3'e ertele).
- **Ortak `EmptyState` + `Skeleton` primitifleri**: `components/ui/` altında,
  mevcut ekranlara aşamalı benimseme.

### P1 — Global AI Copilot · ~1–2 hafta
- Komut paletine **doğal dil modu**: "6M altı 3+1 ilgilenen müşterileri bul",
  "bugünün özeti", "unutulmuş müşteriler". `app/api/chat` + `lib/matching.ts`
  üzerine tool-calling. Proaktif öneri kartları dashboard'a (`Insight` besler).
- Kanallar arası **AI yanıt üretimi**: kişi sayfasındaki WhatsApp/e-posta için
  "yanıt öner".

### P2 — CRM döngülerini kapat (elde tutma) · ~2 hafta
Mevcut emlak/ofis kullanıcısının günlük işini bitirdiği yer. En yüksek elde-tutma etkisi.
- **İletişim derinliği**: kişi sayfasındaki WhatsApp'ı link-out'tan **kayıtlı etkileşime**
  taşı (`Activity`'e log), şablonları her yere yay; SMS sağlayıcı (Netgsm) + arama
  kaydı modeli.
- **Takvim çift-yön senkron**: Google (`google-auth-library` zaten mevcut) → `Appointment`.
- **Müşteri portalı akışı**: `ofis/[slug]` içinde randevu talebi + teklif takibi
  (`SiteUser`/`Favorite` üstüne).

### P3 — Büyüme & güven · landing çalışmasıyla paralel
- Analitikte **tahmin/forecast + AI öngörü** kartları (`Insight` besler).
- **Denetim (audit) görünümü**: mevcut `Activity` verisini yönetim ekranına aç.
- Portföy cilası: **duplicate tespiti**, QR kod, watermark tutarlılığı (`lib/images.ts`).

### P4 — Belge & entegrasyon derinliği · sürekli
- Belge kasası: versiyonlama + e-imza-hazır akış (`Contract` üstüne).
- Marketplace: Open API iskeleti (webhook + API key yönetimi).

### ⏸ Ertelendi (pasif) — İnşaat & Proje Satış dikeyi
`CONSTRUCTION` dikeyi, `Project/Block/Floor/Unit` modeli, interaktif envanter haritası
ve proje bazlı satış hunisi **şimdilik kapsam dışı**. Veri modeli taslağı (Bölüm D)
gelecekte referans olarak korunur; mevcut mimari (`getVertical()`) yeni dikeye hazır
olduğu için ileride düşük riskle eklenebilir.

---

## D. İnşaat dikeyi — veri modeli taslağı (⏸ ertelendi, ileride referans)

```prisma
enum UnitStatus { AVAILABLE RESERVED SOLD BLOCKED MAINTENANCE }

model Project {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  status    StudioProjectStatus // veya ayrı ProjectStatus
  blocks    Block[]
  // teslim tarihi, ilerleme %, galeri, belgeler
}
model Block  { id String @id; projectId String; name String; floors Floor[] }
model Floor  { id String @id; blockId  String; level Int;  units  Unit[] }
model Unit   {
  id String @id; floorId String; label String;
  status UnitStatus @default(AVAILABLE)
  rooms String?; area Float?; price Decimal?
  // rezervasyon, ödeme planı ilişkileri
}
```

> Tüm yeni tablolar `tenantId` ile izole; migration yalnızca ekleme yapar,
> mevcut `Listing`/`Deal` akışlarına dokunmaz.

---

## Öncelik önerisi (özet — inşaat pasif)

Yeni sıra: **P0 (premium his: ⌘K + nav gruplama + empty/skeleton) → P1 (global AI
copilot) → P2 (CRM döngülerini kapat) → P3 (büyüme/güven) → P4 (belge/entegrasyon)**.

**Başlangıç: P0 → komut paleti (⌘K).** Sıfır risk, tamamen eklemeli, hiçbir rota/model
bozulmaz; üstelik P1 copilot'un doğal teslim yüzeyi olduğu için atılmış efor değil,
temel. İlk somut artış: global arama (ilan/kişi/lead) + hızlı aksiyonlar (yeni ilan,
yeni lead, git-to sayfa) — `cmdk` ile tek bileşen + `app/(app)/layout.tsx` portalı.
