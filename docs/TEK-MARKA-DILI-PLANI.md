# Faz 1 — Tek Marka Dili: Monokrom Kurumsal (Apple referansı)

> Temmuz 2026. Bu doküman **plan**dır; kod değişikliği içermez. Onaydan sonra
> uygulanacak sıra ve risk haritası aşağıdadır.

---

## 1. Teşhis — tasarım dili neden karıştı

Bugün ürünün üç yüzü, üç ayrı dil konuşuyor:

| Yüzey | Aksan | Mürekkep | Nereden geliyor |
|---|---|---|---|
| **Panel** (`/dashboard`) | Selvi yeşili `#1e5b3e` | Yeşil-siyah `#17201c` | `@theme` PARSEL paleti — projenin **ilk ve en oturmuş** dili, gece modu dahil |
| **Landing** (`/`) | Amber `#f59e0b` | Soğuk lacivert `#0f1720` | `.landing-root` remap — **Faz 1'de ben ekledim** |
| **Vitrin** (`/ofis/[slug]`) | Ofisin kendi rengi | Soğuk lacivert `#0f1720` | `.showcase-root` + `brandPalette()` — **Faz 2'de ben ekledim** |

Buna ek olarak `btn-selvi` sınıfı `--app-brand-fill` (uygulama yeşili) basıyor ve
bu, marka rengi ne olursa olsun her yüzeye sızıyor.

**Sonuç:** 3 aksan rengi + 2 mürekkep + kaçak bir 4. yeşil. Kullanıcının
"tasarım dili karıştı" teşhisi doğru — ve karışıklığın büyük kısmı son iki
fazda eklendi. Bu plan onu geri alıyor.

---

## 2. Hedef ilke — "gri marka taşır, renk anlam taşır"

Apple'ın kurumsal dilinin özü renk yokluğu değil, **renge iş yüklememesi**:

- Marka kimliği **tipografi + boşluk + nötr gri ölçeği** ile taşınır.
- Renk yalnız iki yerden gelir: **içerik** (ilan fotoğrafı) ve **durum**
  (satıldı / gecikmiş kira / hata).
- Böylece içerik öne çıkar, arayüz geri çekilir.

Bizim için bunun pratik karşılığı:

> **EmlakFlow'un kendi yüzeyleri monokrom olur. Renk, ofisin vitrininde ve
> ilan fotoğraflarında yaşar.**

Bu ayrım tesadüfi değil — vitrin zaten EmlakFlow'un değil, **ofisin markası**.
Monokrom bir panel, ofisin rengini ezmek yerine ona çerçeve olur. Yani tek dil
kurmak vitrin renklerini öldürmez, tam tersine güçlendirir.

---

## 3. Token katmanı (uygulanacak)

### 3.1 Nötr ölçek — tek rampa

Hafif soğuk, saf siyah/beyaz yok (Apple'ın en belirgin detayı: `#1d1d1f`,
`#000` değil — ekranda daha az sert).

```css
--n-0:   #ffffff;  /* kart yüzeyi */
--n-25:  #fbfbfd;  /* en açık zemin */
--n-50:  #f5f5f7;  /* ikinci zemin — bölüm ayrımı */
--n-100: #ececee;  /* çok hafif ayraç */
--n-200: #d9d9dd;  /* kenarlık */
--n-300: #c4c4ca;  /* pasif kenarlık */
--n-400: #9a9aa2;  /* placeholder */
--n-500: #6e6e76;  /* ikincil metin */
--n-600: #4b4b52;  /* üçüncül başlık */
--n-700: #33333a;
--n-800: #22222a;
--n-900: #1d1d1f;  /* BİRİNCİL MÜREKKEP */
--n-950: #111114;  /* koyu blok zemini */
```

### 3.2 Semantik renk — yalnız durum, düşük doygunluk

```css
--s-success: #1f7a4d;  /* satıldı / tahsil edildi */
--s-warning: #9a6b12;  /* yaklaşan kira / eksik bilgi */
--s-danger:  #a33232;  /* gecikmiş / hata */
--s-info:    #2f5c8a;  /* bilgilendirme */
```

Bu renkler **rozet ve ikon** dışında kullanılmaz. Buton, başlık, link almaz.

### 3.3 Etkileşim

| Rol | Değer |
|---|---|
| Birincil buton | `--n-900` dolgu, beyaz metin |
| Birincil hover | `--n-800` |
| İkincil buton | şeffaf zemin, `--n-200` kenarlık, `--n-900` metin |
| Link | `--n-900` + alt çizgi (renk değil, çizgi taşır) |
| Odak halkası | `--n-900` %40, 2px offset |

**Kritik:** Renkli CTA kalkıyor. Amber düğme, yeşil düğme yok — hepsi ink.

### 3.4 Gece modu

Rampa ters çevrilir, **aynı isimlerle**:

```css
.app-shell[data-theme="dark"] {
  --n-0: #1c1c1e;  --n-25: #161618;  --n-50: #202024;
  --n-900: #f5f5f7; /* mürekkep aydınlanır */
  ...
}
```

Tek rampa iki temada tanımlı olduğu için bileşenler tema bilmez — bugünkü
`--app-*` dağınıklığı da bu rampaya toplanır.

---

## 4. Monogram ve wordmark

Mevcut `components/brand-logo.tsx`:

- `BrandMark` → `btn-selvi` (yeşil kare, beyaz harf). **Değişecek:** `--n-900`
  dolgu, beyaz harf, squircle köşe (`rounded-[28%]`, Apple'ın kare-daire arası
  formu). Tek harf `E`, geometrik grotesk, optik merkezleme.
- `BrandLogo` → bugün `Emlak` + yeşil `Flow`. **Değişecek:** renk vurgusu kalkar,
  ayrım **ağırlıkla** yapılır: `Emlak` medium + `Flow` semibold, tek mürekkep.
  Bu, Apple'ın alt-marka dili (örn. "Apple **TV**") ile aynı mantık.
- White-label (Premium) davranışı **aynen korunur** — ofis adı basılır.

Favicon/app ikonu da aynı monograma çekilir (bugün koyu yeşil `E`).

---

## 5. "Daha detaylı dashboard" — somut plan

İstek "daha detaylı" idi; bunu üç ayrı işe ayırıyorum çünkü üçü farklı emek:

### 5.1 Yoğunluk (density) — en görünür kazanç
Bugün kartlar geniş, bilgi seyrek. Kurumsal panel dili sıkı olur:
- 8pt grid'e otur; kart iç boşluğu `24px → 16px`
- Tablo satır yüksekliği `56px → 40px`
- Metrikler `tabular-nums` (rakamlar zıplamaz)

### 5.2 Bilgi mimarisi — "Bugün" ekranı
Tek ekranda cevaplanması gereken soru: *bugün neye dokunmalıyım?*

| Bölge | İçerik |
|---|---|
| Üst şerit | 4 metrik: aktif portföy · bu ay kapanan · bekleyen talep · **tahsil edilmemiş kira** |
| Sol kolon | Bugünün ajandası + bekleyen aksiyonlar (gecikmiş görev üstte) |
| Sağ kolon | Satış hattı hunisi (aşama başına adet + tutar) + son hareketler |

Her metrik kartı standart: değer · dönem farkı (▲/▼) · mikro sparkline.

### 5.3 Detay katmanları
- **Tablo dili:** yapışkan başlık, satır içi hızlı aksiyon, çok seçim
- **Boş durumlar:** her liste için "ilk kaydı ekle" yönlendirmesi
- **Klavye:** ⌘K zaten var; satır navigasyonu (`j/k`, `enter`) eklenebilir

---

## 6. Uygulama sırası ve risk

| # | İş | Dosya | Risk | Geri alma |
|---|---|---|---|---|
| 1 | Nötr rampa + semantik token tanımı | `app/globals.css` | Düşük | Tek commit revert |
| 2 | `.landing-root` amber remap'ini sil | `app/globals.css` | Düşük | Aynı |
| 3 | `btn-selvi` → nötr `.btn-primary` | `globals.css` + 3-4 çağrı | **Orta** — sınıf birden çok yerde | Sınıfı alias bırak |
| 4 | Monogram/wordmark monokrom | `brand-logo.tsx` | Düşük | Aynı |
| 5 | Panel yoğunluk + Bugün ekranı | `app/(app)/**` | **Yüksek** — en büyük iş, gece modu ikinci kez test ister | Parça parça |
| 6 | Vitrin | — | **DOKUNULMAZ** — ofis rengi korunur | — |

**Tahmini emek:** 1–4 arası tek oturum. 5. madde ayrı bir faz; panelin her
ekranı tek tek geçilmeli ve **iki temada da** gözle doğrulanmalı.

**Uyarı:** Panelde gece modu var. Renk değişiklikleri bileşen içinde
sabit (hard-coded) sınıflarla değil, **yalnız token üzerinden** yapılmalı;
aksi halde bir tema sağlam görünürken diğeri bozulur. Bu, landing/vitrin
fazlarından temel farkı.

---

## 7. Bu plan neyi bilerek yapmıyor

- **Vitrin renklerini tekleştirmiyor.** Ofis markası EmlakFlow markası değil.
- **Semantik renkleri kaldırmıyor.** Gecikmiş kira kırmızı kalmalı — monokrom
  uğruna okunabilirlik feda edilmez.
- **İlan fotoğraflarına filtre uygulamıyor.** Renk oradan gelmeli.
