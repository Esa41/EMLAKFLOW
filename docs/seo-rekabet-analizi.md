# Faz 3 — SEO Rekabet Analizi ve Saldırı Planı

> Temmuz 2026. Girdi: Soro (trysoro.com) otomatik site analizi ekran görüntüleri.
> Bu doküman `docs/seo-buyume-plani.md`'nin **üzerine** kurulur, onu tekrar
> etmez — oradaki huni/pillar yapısı geçerlidir.

---

## 1. Aracın çıktısı — neyi doğru, neyi yanlış gördü

### Doğru gördükleri

Soro'nun çıkardığı **içerik fikirleri ve tema kümesi isabetli** ve bizim
mevcut planımızla örtüşüyor:

| Soro'nun önerdiği içerik | Tahmini kazanç/ay | Bizdeki karşılığı |
|---|---|---|
| Ücretsiz Emlak Web Sitesi Kurma | +2.400 | Ana sayfa (Faz 2 metni) |
| Gayrimenkul CRM Programı | +1.900 | MoF kategori sayfası |
| Emlak Ofisi İçin Müşteri Takip Sistemi | +1.600 | MoF özellik sayfası |
| Emlakçı İçin İlan Takip Programı | +1.300 | MoF use-case sayfası |
| Kirasını Takip Eden Emlak Programı | +700 | MoF özellik sayfası |

Marka tonu okuması da doğru: "modern, pratik, satış odaklı, verimlilik dili".

### Yanlış gördüğü — düzeltilmesi şart

Araç rakip olarak **Airbnb, Sahibinden, Zingat, Hepsiemlak**'ı listelemiş.
Bu liste stratejik olarak yanlış ve **olduğu gibi takip edilirse bütçe ve emek
boşa gider:**

1. **Arama amacı (intent) uyuşmuyor.** Sahibinden/Zingat/Hepsiemlak'ı
   *tüketici* arar: "satılık daire kadıköy". EmlakFlow'u *emlakçı* arar:
   "gayrimenkul crm programı". Aynı SERP'te yarışmıyoruz; farklı kitleyiz.
2. **Yarışılabilir değil.** Bu portallar milyonlarca indeksli sayfa ve çok
   yüksek domain otoritesiyle oturuyor. "Satılık daire" kümesine girmek
   kazanılamayacak bir savaş.
3. **Onlar rakip değil, konumlandırmada karşı taraf.** EmlakFlow'un satış
   argümanı zaten "portalda kaybolma, kendi adresin olsun". Yani bu markalar
   **metinde düşman, SEO'da rakip değil.**
4. **Airbnb tamamen alakasız** — kısa dönem kiralama pazarı, B2C.

**Ayrıca "+15.700 ziyaretçi/ay" rakamı bir satış aracının tahminidir.** Gerçek
hedef Search Console verisiyle kurulmalı; bu sayı plana taahhüt olarak
yazılmamalı.

---

## 2. Gerçek rakip haritası

SEO'da bizi asıl karşılayacak üç grup:

| Grup | Kim | Zorluk | Tutum |
|---|---|---|---|
| **A. Yerli emlak yazılımları** | Türkiye'ye özel emlak/portföy programları, ofis otomasyonu satan yerel firmalar | Orta | **Asıl savaş burada.** Çoğunun içeriği zayıf, sayfaları eski, fiyat gizli |
| **B. Genel CRM'lerin Türkçe içerikleri** | Zoho, Bitrix24, HubSpot'un "emlak CRM" sayfaları | Orta-yüksek | Otoriteleri yüksek ama **dikeye özel değil** — "emlakçıya özel" açısı bizim silahımız |
| **C. Franchise iç sistemleri** | Büyük emlak zincirlerinin kendi panelleri | Düşük | SEO'da yarışmıyorlar; bağımsız ofis hedeflemesi bize açık |

**Kazanma tezi:** A grubunun içerik boşluğu + B grubunun dikey körlüğü.
"Emlakçıya özel" + "ücretsiz başlangıç" ikilisi, ikisinin de karşılayamadığı
bir kombinasyon.

---

## 3. Rekabetçi tutum — nerede saldırılır

### 3.1 Karşılaştırma sayfaları (en yüksek dönüşüm)
Rakip adı + "alternatif" araması satın almaya en yakın niyettir:
- `/karsilastir/[rakip]-alternatifi`
- `/emlak-crm-karsilastirma` — fiyat, ücretsiz plan, kurulum süresi tablosu

**Kural:** Rakipleri kötülemeyin, **karşılaştırın**. Yanlış veya kanıtlanamaz
bir iddia hem hukuki risk hem güven kaybıdır. Tabloda yalnız kamuya açık
bilgi kullanın ve tarihini yazın.

### 3.2 Fiyat şeffaflığı — A grubunun en zayıf noktası
Yerli yazılımların çoğu fiyatı gizliyor, "teklif alın" diyor. Arayan kişi
fiyatı öğrenmek istiyor. **Açık fiyat sayfası** bu kümede tek başına fark yaratır.

> ⚠️ Şu an landing'de tüm ücretli planlar "Teklif al" durumunda
> (`84a5f45` commit'i). Bu, SEO/CRO açısından rakiplerin zayıf noktasını
> bizim de tekrarlamamız demek. **Ücretsiz planın bedava olduğunun net
> görünmesi** kritik; ücretli fiyatlar gizli kalacaksa en azından
> "başlangıç ücretsiz" mesajı fiyat sayfasında birincil olmalı.

### 3.3 "Portaldan kendi siteme" açısı
Rakiplerin girmediği, bizim doğal olarak sahiplendiğimiz küme:
- "sahibinden doping ücreti değer mi"
- "emlakçı kendi web sitesi neden gerekli"
- "emlak ilanı nereye verilir"

Bu içerikler portalları hedef almaz, **portal bağımlılığının maliyetini**
anlatır ve doğal olarak bize çıkar.

---

## 4. En büyük kaldıraç: vitrin sayfaları (programatik SEO)

Bu, hiçbir rakibin kopyalayamayacağı yapısal avantaj: **her ofis vitrini
indekslenebilir bir sayfa.** 500 ofis = 500 site + binlerce ilan sayfası.

Ama iki şartla:

**Şart 1 — İnce içerik (thin content) kapısı.** Boş veya 1-2 ilanlı vitrinler
indekslenmemeli. Öneri: `showcaseEnabled` + **en az 3 aktif ilan** olmayan
vitrine `noindex`. Yüzlerce zayıf sayfa, alan adının tamamına zarar verir.

**Şart 2 — Tekilleşme.** Aynı ilan hem `/ofis/[slug]/ilan/[id]` hem custom
domain altında görünüyorsa canonical tek adrese işaret etmeli. `lib/url.ts`
içindeki `showcaseUrl` bunu zaten ayırıyor — canonical'ların custom domain
senaryosunda doğru bastığı **test edilmeli**.

Bu ikisi kurulduğunda vitrin ağı, yerel aramalarda ("kadıköy emlak ofisi")
rakiplerin hiç giremeyeceği bir yüzey açar.

---

## 5. Öncelik sırası (ilk 90 gün)

| Sıra | İş | Neden önce |
|---|---|---|
| 1 | Ana sayfa metnini Faz 2 metniyle değiştir + **FAQPage şeması** | En yüksek getirili tek iş; zengin sonuç kutusu |
| 2 | 5 adet MoF program sayfası (Soro'nun listesi) | Satın almaya yakın niyet, düşük rekabet |
| 3 | Vitrin `noindex` kapısı + canonical testi | Zarar önleme — geciktikçe pahalılaşır |
| 4 | Fiyat şeffaflığı kararı | Dönüşümü doğrudan etkiler |
| 5 | 2 karşılaştırma sayfası | Rakip marka aramalarını yakalar |
| 6 | ToF pillar içerikleri (mevcut planda tanımlı) | Hacim motoru, en yavaş getirili |

**Ölçüm:** Search Console'da bu 5 kelime için ayrı bir görünüm kur; 90 gün
sonunda gerçek veriye göre revize et. Araç tahminleriyle değil, kendi
verinizle yönetin.

---

## 6. Yapılmaması gerekenler

- ❌ Sahibinden/Zingat/Hepsiemlak kelimelerinde organik yarışmaya çalışmak
- ❌ "+15.700 ziyaretçi" gibi araç tahminlerini hedef olarak taahhüt etmek
- ❌ Rakip hakkında doğrulanmamış iddia içeren karşılaştırma tablosu
- ❌ Boş vitrinleri indekse açık bırakmak
- ❌ Aynı metnin ufak varyasyonlarıyla onlarca "program" sayfası üretmek
      (doorway page sayılır, cezalandırılır)
