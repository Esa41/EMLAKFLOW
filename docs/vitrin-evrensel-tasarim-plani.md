# Vitrin — Evrensel Tasarım + Tema Sistemi Planı

> Temmuz 2026. Tetikleyen gözlem: yeni açılan bir ofisin (ESA EMLAK, 1 ilan,
> fotoğrafsız) vitrini **boşluğunu reklam ediyor**.

---

## 1. Teşhis — vitrin "zengin içerik" varsayımıyla tasarlanmış

Mevcut sayfa, ofisin çok ilanı ve iyi fotoğrafları olduğunu varsayıyor. İçerik
seyrek olduğunda zarifçe küçülmüyor, **kırılıyor**:

| Bölüm | Zengin ofiste | Yeni ofiste (gerçek durum) |
|---|---|---|
| Hero görseli | En iyi ilan fotoğrafı | Fotoğraf yoksa **düz gri gradyan** — bozuk görünüyor |
| İstatistik şeridi | 128 ilan · 40+ işlem | **"1 Aktif İlan · 0+ Tamamlanan İşlem"** |
| Tecrübe rozeti | "12 Yıl" | **"—"** |
| Koleksiyonlar | Öne çıkanlar + yeniler | Tek ilan iki rafta da tekrar ediyor |

**Asıl zarar istatistik şeridinde.** Potansiyel bir alıcıya "bu ofis bugüne
kadar hiçbir işlem tamamlamadı" demek, hiçbir şey dememekten kötüdür. Sıfırı
göstermek güven yıkar.

### Tasarım ilkesi
> **Vitrin asla boşluğunu ilan etmez.** Zayıf sinyal gösterilmez; ya
> gizlenir ya da yerini içerikten bağımsız bir güven unsuru alır.

Her bölümün üç hâli olmalı: **zengin / seyrek / boş** — ve seyrek hâl
"eksik" değil "sade" görünmeli.

---

## 2. FAZ 1 — Boşluğa dayanıklı evrensel taban (şema GEREKTİRMEZ)

Tüm ofisler için geçerli. Tema seçiminden bağımsız, her temanın altında çalışır.

### 2.1 Hero görseli — kademeli geri çekilme
```
ofis fotoğrafı (officePhotoUrl)
  → en iyi ilan fotoğrafı
  → TİPOGRAFİK HERO (fotoğrafsız)
```
Son basamak kritik: fotoğraf yoksa düz gradyan yerine **kasıtlı görünen**
tipografik bir sahne — dev marka adı, film greni, ince ızgara. "Fotoğraf
yüklenmemiş" değil, "böyle tasarlanmış" hissi verir.

### 2.2 İstatistik şeridi — sıfırlar elenir
Adaylar üretilir, sonra **sunulabilirlik filtresi** uygulanır:
- Değeri 0 olan hiçbir istatistik gösterilmez
- "Tamamlanan işlem" ancak **≥ 3** ise gösterilir (1–2 işlem güven vermez)
- "—" gibi yer tutucu değerler asla basılmaz
- Elde **2'den az** istatistik kalırsa şerit tamamen gizlenir

Yerine **güven şeridi** geçer — içerikten bağımsız, her ofis için doğru:
`Aynı gün dönüş · Yerinde inceleme · Şeffaf fiyat · Tapu sürecinde eşlik`

### 2.3 Koleksiyonlar
- Bir raf 2'den az ilan içeriyorsa gösterilmez
- Toplam ilan < 3 ise "Öne çıkanlar / Yeni gelenler" ayrımı kalkar, tek liste

### 2.4 Sıfır ilan hâli
Portföy boşken vitrin "bozuk mağaza" gibi görünmemeli:
- Portföy bölümü yerine: *"Portföy hazırlanıyor — aradığınızı bırakın, uyan
  mülk girdiği an arayalım."* + talep formu öne alınır
- Amaç: envanter yokken bile **talep toplamak**

### 2.5 Etkilenen dosyalar
`app/ofis/[slug]/page.tsx` (istatistik/koleksiyon mantığı),
`components/showcase-hero.tsx` (tipografik geri çekilme)

---

## 3. FAZ 2 — Tema sistemi (Premium) — ŞEMA GEREKTİRİR

### 3.1 Veri
```prisma
model Tenant {
  showcaseTheme String @default("classic")  // classic | editorial | gallery | minimal
}
```

### 3.2 Temalar
| Tema | Kime | Karakter |
|---|---|---|
| **Klasik** (varsayılan) | Herkes | Bugünkü düzen — foto hero + koleksiyon rafları |
| **Editoryal** | Az fotoğraflı, butik ofis | Tipografi ağırlıklı, dev başlıklar, foto ikincil |
| **Galeri** | Lüks / villa portföyü | Tam ekran foto ızgarası, metin minimum |
| **Minimal** | Kurumsal / ticari | Liste odaklı, hızlı tarama, süs yok |

Her tema **aynı bileşenleri** kullanır; değişen düzen ve yoğunluktur. Böylece
yeni bir tema eklemek yeni bir sayfa yazmak değil, bir düzen varyantı olur.

### 3.3 Kapı (gating)
- **Ücretsiz / Pro:** Klasik sabit. Ayarlar'da diğerleri kilitli görünür
  ("Premium'da") — merak uyandırır, yükseltme sebebi olur
- **Premium / Kurumsal:** Ayarlar > Vitrin'den seçilebilir

Kilidi `isPremium(tenant.plan)` ile kur — `lib/plans-config.ts` zaten var.

### 3.4 Neden Premium'a uygun
Marka rengi ve logo zaten Premium özelliği. Tema seçimi aynı ailenin devamı:
"vitrin senin markan gibi görünsün". Tutarlı bir paket hikâyesi.

---

## 4. Sıra ve bağımlılık

| # | İş | Şema? | Durum |
|---|---|---|---|
| 1 | Faz 1 — boşluğa dayanıklı taban | Hayır | **Hemen yapılabilir** |
| 2 | Faz 2 — tema alanı + seçici | Evet | `db push` bekliyor |

**Faz 1 önce gelmeli.** Tema sistemi, altındaki taban kırılganken anlamsız:
Premium bir ofis "Galeri" temasını seçse bile fotoğrafı yoksa yine boş görünür.
Önce hiçbir içerikle bozulmayan bir taban, sonra onun üstünde tema çeşidi.

---

## 5. Bilerek yapılmayacaklar

- **Sahte istatistik üretmek.** "50+ mutlu müşteri" gibi doğrulanamayan
  rakamlar yazılmaz; boş bırakmak yalan söylemekten iyidir.
- **Stok fotoğrafla hero doldurmak.** Landing'de aynı hatayı yaptık ve geri
  aldık: ofisin kendi mülkü olmayan bir görsel güven vermez, yanıltır.
- **Tema sayısını çoğaltmak.** Dört tema yeter; her tema bakım yüküdür.
