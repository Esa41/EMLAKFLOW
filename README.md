# EmlakFlow · Faz 1 — Auth + Uygulama İskeleti

ESAPP ekosisteminin PropTech vertikali. Çok kiracılı (multi-tenant) gayrimenkul SaaS.
**Next.js 15 (App Router) + TypeScript + Prisma + Neon + Tailwind v4 + NextAuth v5**

## Bu fazda ne var

- **Auth:** NextAuth (credentials + bcrypt), JWT session'da `tenantId / userId / role`.
  `getSession()` → `{ tenantId, userId, role, name, tenantName }` sözleşmesi.
- **Tenant kayıt akışı:** `/register` → ofis (Tenant) + OWNER tek transaction'da.
- **Middleware:** oturumsuz erişim `/login`'e yönlenir.
- **Onaylanan tasarım:** açık tema, frosted glass sidebar, gradient logo,
  gradient stat kartları, fotoğraflı ilan kartları.
- **7 bölümlü navigasyon:** Ana Dashboard · Portföy · Müşteriler · Ajanda ·
  Finans & Sözleşmeler · Ekip · Ayarlar.
- **Dashboard gerçek veriden besleniyor:** aktif ilan / açık talep / açık fırsat /
  pipeline değeri + son ilanlar + bugünün ajandası (`forTenant` üzerinden).
- Çekirdek: `prisma/schema.prisma` (12 model), `lib/tenant.ts`, `lib/matching.ts`.

## Kurulum

```bash
npm install
cp .env.example .env        # Neon URL'leri + AUTH_SECRET doldur
npx prisma generate
npx prisma db push          # veya: npx prisma migrate dev --name init
npx prisma db seed          # demo ofis + 16 ilan + 10 lead + pipeline
npm run dev
```

**Demo girişleri** (şifre: `demo1234`)

| E-posta | Rol |
|---|---|
| sahibi@atlasgayrimenkul.com | OWNER |
| zeynep@atlasgayrimenkul.com | AGENT |
| murat@atlasgayrimenkul.com | AGENT |

Seed tekrar çalıştırılabilir: demo ofisi silip sıfırdan kurar. Bugüne 3 randevu
düşer, böylece dashboard'daki "Bugünün Ajandası" hep dolu görünür.

İstersen `/register`'dan kendi ofisini de açabilirsin — veriler tamamen izole.

## Dosya haritası

```
emlakflow/
├── prisma/schema.prisma        # 12 model + enum'lar
├── lib/
│   ├── prisma.ts               # singleton
│   ├── tenant.ts               # forTenant() izolasyonu
│   ├── matching.ts             # eşleştirme motoru
│   └── auth.ts                 # NextAuth v5 + getSession()
├── middleware.ts               # route koruması
├── app/
│   ├── (auth)/login, register  # giriş / ofis açma
│   ├── (app)/layout.tsx        # sidebar + topbar shell
│   ├── (app)/dashboard/        # ana dashboard (canlı DB verisi)
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth handler
│       └── register/           # tenant + owner oluşturma
└── components/sidebar.tsx      # frosted glass, 7 bölüm
```

## Durum: Onaylanan 8 maddelik liste tamamlandı ✅

Çekirdek + fark yaratanlar bitti: auth, shell, dashboard, seed, portföy CRUD,
R2 medya, CRM Kanban, eşleştirme bildirimleri, komisyon motoru, Ayarlar,
portal XML feed (`/api/feed/{token}.xml` — public, token'lı, 15 dk edge cache).

**Vitrin 2.0 (Kocaeli demo):** landing'e Leaflet haritası eklendi — koordinatlı
her ilan haritada fiyat plakası olarak durur, plakaya tıkla → detay. Detay
sayfasında ilanın mini konum haritası. Hakkımızda/Vizyon bölümü Ayarlar'dan
beslenir (başlık, hikâye, vizyon cümlesi, 3 istatistik plakası, ekip şeridi
aç/kapa) — boş alan vitrinde hiç görünmez. İlan formuna enlem/boylam girişi
eklendi. Seed artık Kocaeli evreni: İzmit, Başiskele, Kartepe/Köseköy, Gölcük,
Derince, Körfez, Karamürsel — 16 koordinatlı ilan, vitrin içerikleri dolu.

**Vitrin paketi:** her ofise public sayfa `/ofis/{slug}` — filtreli ilan
ızgarası, künyeli detay sayfası (galeri, künye tablosu, danışman kartı,
WhatsApp), SEO/OpenGraph. Vitrindeki "Bilgi al" ve "Aradığımı bulamadım"
formları doğrudan CRM'e Contact+Lead düşürür ve bildirim zilini çalar.
Ayarlar > Vitrin: aç/kapa, tanıtım cümlesi, WhatsApp hattı, link kopyalama.

> Şema en son vitrin alanlarıyla (showcaseEnabled, showcaseTagline, whatsapp)
> güncellendi — `npx prisma db push` çalıştırmayı unutma.

## Sonraki ufuk (Faz 4)

Tüm 7 modül gerçek içerikle dolu: Dashboard · Portföy · Müşteriler (Kanban) ·
Ajanda · Finans · Ekip · Ayarlar.

- Prod deploy (Vercel + Neon + R2), domain
- Trial/abonelik katmanı (baştan ödeme duvarıyla)
- 2-3 pilot ofis ile saha testi

## Faz 1'de tamamlananlar

- Auth + tenant kayıt + middleware (Edge-uyumlu split config)
- 7 bölümlü shell (masaüstü sidebar + mobil drawer)
- Canlı dashboard (stat kartlar, son ilanlar, bugünün ajandası)
- Seed: demo ofis, 3 kullanıcı, 16 ilan, 10 lead, pipeline + komisyonlar
- **Portföy CRUD**: liste (filtre + arama), yeni ilan, detay/düzenleme, onaylı silme
- **R2 medya**: presigned PUT ile tarayıcıdan doğrudan yükleme, silme, tenant-scoped key doğrulaması
- **Eşleştirme canlı**: yeni ilan kaydında açık taleplerle skorlanır; detay sayfasında
  eşleşen talepler telefon + skor + gerekçelerle listelenir
