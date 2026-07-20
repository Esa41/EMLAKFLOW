/**
 * EmlakFlow · Demo Seed
 * Çalıştır: npx prisma db seed   (package.json → prisma.seed)
 * Tekrar çalıştırılabilir: demo ofislerini silip yeniden kurar.
 *
 * Demo girişleri (şifre hepsi: demo1234)
 *   sahibi@atlasgayrimenkul.com   → OWNER  (Emre Atlas)
 *   zeynep@atlasgayrimenkul.com   → AGENT  (Zeynep Kaya)
 *   murat@atlasgayrimenkul.com    → AGENT  (Murat Demir)
 *   enes@vipgayrimenkul.com       → OWNER  (Enes Yılmaz - Detaylı Test Data)
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { notificationLinks, dateParam } from "../lib/notification-links";

const prisma = new PrismaClient();

const SLUG_ATLAS = "atlas-gayrimenkul";
const SLUG_VIP = "vip-gayrimenkul";
const SLUG_GALERI = "akdeniz-otomotiv"; // AUTO_DEALER dikeyi demo galerisi
const SLUG_PRESTIJ = "prestij-gayrimenkul"; // AI Stüdyo vitrin ofisi (referans videolar)
// Prisma, Decimal alanlara number kabul eder — P sadece okunabilirlik için
const P = (n: number) => n;

// Unsplash — konut iç/dış mekân görselleri (genişletilmiş koleksiyon)
const PHOTOS = [
  "photo-1560448204-e02f11c3d0e2",
  "photo-1512917774080-9991f1c4c750",
  "photo-1600596542815-ffad4c1539a9",
  "photo-1600585154340-be6161a56a0c",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1493809842364-78817add7ffb",
  "photo-1502672260266-1c1ef2d93688",
  "photo-1560185007-cde436f6a4d0",
  "photo-1560184897-ae75f418493e",
  "photo-1484154218962-a197022b5858",
  "photo-1554995207-c18c203602cb",
  "photo-1556912167-f556f1f39fdf",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753086-00f18fb6b3ea",
  "photo-1600585154526-990dced4db0d",
  "photo-1600047509807-ba8f99d2cdde",
  "photo-1568605114967-8130f3a36994",
  "photo-1570129477492-45c003edd2be",
  "photo-1582268611958-ebfd161ef9cf",
  "photo-1580587771525-78b9dba3b914",
  "photo-1564013799919-ab600027ffc6",
  "photo-1449844908441-8829872d2607",
  "photo-1505873242700-f289a29e1e0f",
  "photo-1567767292278-a4f21aa2d36e",
  "photo-1565182999561-18d7dc61c393",
  "photo-1481277542470-605612bd2d61",
  "photo-1494526585095-c41746248156",
  "photo-1513584684374-8bab748fbf90",
  "photo-1509644851169-2acc08aa25b5",
  "photo-1616486338812-3dadae4b4ace",
  "photo-1515263487990-61b07816b324",
  "photo-1523217582562-09d0def993a6",
  "photo-1484154218962-a197022b5858",
  "photo-1556912173-46c336c7fd55",
  "photo-1574643156929-51fa098b0394",
  "photo-1617806118233-18e1de247200",
].map((id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`);

function todayAt(h: number, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
function daysFromNow(n: number, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  // Önceki demo'ları temizle (cascade tüm alt kayıtları siler)
  await prisma.tenant.deleteMany({ where: { slug: { in: [SLUG_ATLAS, SLUG_VIP, SLUG_GALERI, SLUG_PRESTIJ] } } });

  const passwordHash = await hash("demo1234", 12);

  // ═══════════════════════════════════════════════════════════════════
  // ATLAS GAYRİMENKUL (Mevcut Seed)
  // ═══════════════════════════════════════════════════════════════════

  const tenant = await prisma.tenant.create({
    data: {
      name: "Atlas Gayrimenkul",
      slug: SLUG_ATLAS,
      city: "Kocaeli",
      district: "İzmit",
      phone: "+90 262 000 00 00",
      whatsapp: "+90 532 000 00 01",
      plan: "pro",
      showcaseTagline:
        "Körfez'in iki yakasında güvenle alım-satım. Her ilan yerinde incelenip künyelenir — fiyat, metrekare ve tapu bilgisi olduğu gibidir.",
      aboutTitle: "Üç danışman, tek söz: künyesi neyse o.",
      aboutText:
        "İzmit merkezden Kartepe eteklerine, Başiskele sahilinden Gölcük'e — Körfez'in her ilçesini sokak sokak biliriz. Portföyümüzdeki her mülkü yerinde inceler, tapusunu ve iskânını kontrol eder, öyle künyeleriz. Fiyat şişirmeyiz, eksik bilgi vermeyiz.",
      visionText:
        "Emlakta güven, doğru bilginin eksiksiz paylaşılmasıdır — biz künyeye imza atarız.",
      aboutStats: [
        { value: "12", label: "Yıl" },
        { value: "280+", label: "Tamamlanan satış" },
        { value: "%91", label: "Tavsiye oranı" },
      ],
    },
  });
  const t = tenant.id;

  const [owner, zeynep, murat] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: t,
        name: "Emre Atlas",
        email: "sahibi@atlasgayrimenkul.com",
        passwordHash,
        role: "OWNER",
        phone: "+90 532 000 00 01",
      },
    }),
    prisma.user.create({
      data: {
        tenantId: t,
        name: "Zeynep Kaya",
        email: "zeynep@atlasgayrimenkul.com",
        passwordHash,
        role: "AGENT",
        phone: "+90 532 000 00 02",
      },
    }),
    prisma.user.create({
      data: {
        tenantId: t,
        name: "Murat Demir",
        email: "murat@atlasgayrimenkul.com",
        passwordHash,
        role: "AGENT",
        phone: "+90 532 000 00 03",
      },
    }),
  ]);
  const agents = [owner.id, zeynep.id, murat.id];

  // ── Kişiler ──
  const contactData: Array<{
    fullName: string;
    type: "BUYER" | "SELLER" | "TENANT_C" | "LANDLORD";
    phone: string;
  }> = [
    { fullName: "Ayşe Yılmaz", type: "BUYER", phone: "+90 555 111 11 11" },
    { fullName: "Mehmet Öztürk", type: "BUYER", phone: "+90 555 222 22 22" },
    { fullName: "Fatma Şahin", type: "SELLER", phone: "+90 555 333 33 33" },
    { fullName: "Ali Çelik", type: "BUYER", phone: "+90 555 444 44 44" },
    { fullName: "Elif Aydın", type: "TENANT_C", phone: "+90 555 555 55 55" },
    { fullName: "Hasan Koç", type: "LANDLORD", phone: "+90 555 666 66 66" },
    { fullName: "Selin Arslan", type: "BUYER", phone: "+90 555 777 77 77" },
    { fullName: "Burak Doğan", type: "BUYER", phone: "+90 555 888 88 88" },
    { fullName: "Deniz Kurt", type: "TENANT_C", phone: "+90 555 999 99 99" },
    { fullName: "Gamze Polat", type: "BUYER", phone: "+90 555 101 01 01" },
  ];
  const contacts = await Promise.all(
    contactData.map((c) => prisma.contact.create({ data: { tenantId: t, ...c } }))
  );

  // ── İlanlar (16) ──
  type L = {
    title: string;
    purpose: "SALE" | "RENT";
    type: "APARTMENT" | "VILLA" | "LAND" | "COMMERCIAL" | "OFFICE" | "HOUSE";
    price: number;
    district: string;
    neighborhood: string;
    rooms?: string;
    gross?: number;
    net?: number;
    floor?: number;
    age?: number;
    status?: "ACTIVE" | "SOLD" | "RENTED";
    lat?: number;
    lng?: number;
  };
  const L: L[] = [
    { title: "Yahyakaptan'da Güney Cephe 3+1", purpose: "SALE", type: "APARTMENT", price: 6_450_000, district: "İzmit", neighborhood: "Yahyakaptan", rooms: "3+1", gross: 155, net: 130, floor: 5, age: 8, lat: 40.7518, lng: 29.9552 },
    { title: "Yenişehir'de Yenilenmiş 2+1", purpose: "SALE", type: "APARTMENT", price: 3_950_000, district: "İzmit", neighborhood: "Yenişehir", rooms: "2+1", gross: 105, net: 90, floor: 3, age: 22, lat: 40.7621, lng: 29.9413 },
    { title: "Başiskele Sahilde 4+1 Deniz Manzaralı", purpose: "SALE", type: "APARTMENT", price: 8_900_000, district: "Başiskele", neighborhood: "Yeniköy", rooms: "4+1", gross: 195, net: 165, floor: 7, age: 3, lat: 40.7092, lng: 29.9151 },
    { title: "Köseköy'de Site İçi 3+1", purpose: "SALE", type: "APARTMENT", price: 4_350_000, district: "Kartepe", neighborhood: "Köseköy", rooms: "3+1", gross: 145, net: 125, floor: 2, age: 6, lat: 40.7553, lng: 30.0212 },
    { title: "Kartepe Eteklerinde Bahçeli Villa", purpose: "SALE", type: "VILLA", price: 15_800_000, district: "Kartepe", neighborhood: "Maşukiye", rooms: "5+2", gross: 340, net: 290, age: 4, lat: 40.7011, lng: 30.0821 },
    { title: "İzmit Merkez'de Yatırımlık 1+1", purpose: "SALE", type: "APARTMENT", price: 2_450_000, district: "İzmit", neighborhood: "Kemalpaşa", rooms: "1+1", gross: 62, net: 50, floor: 4, age: 18, lat: 40.7648, lng: 29.9201 },
    { title: "Derince'de Marmaray'a Yakın 3+1", purpose: "SALE", type: "APARTMENT", price: 3_650_000, district: "Derince", neighborhood: "Çınarlı", rooms: "3+1", gross: 135, net: 115, floor: 6, age: 14, lat: 40.7563, lng: 29.8312 },
    { title: "Gölcük Değirmendere'de 2+1", purpose: "SALE", type: "APARTMENT", price: 3_150_000, district: "Gölcük", neighborhood: "Değirmendere", rooms: "2+1", gross: 100, net: 85, floor: 3, age: 16, lat: 40.7091, lng: 29.7632 },
    { title: "Umuttepe'ye Komşu Sıfır 3.5+1", purpose: "SALE", type: "APARTMENT", price: 5_750_000, district: "İzmit", neighborhood: "Kabaoğlu", rooms: "3.5+1", gross: 175, net: 148, floor: 8, age: 0, lat: 40.8021, lng: 29.8891 },
    { title: "İzmit Sanayi'de Cadde Üstü Kiralık Ofis", purpose: "RENT", type: "OFFICE", price: 55_000, district: "İzmit", neighborhood: "Sanayi", gross: 130, net: 110, floor: 1, age: 10, lat: 40.7712, lng: 29.9451 },
    { title: "Yahyakaptan'da Kiralık Eşyalı 2+1", purpose: "RENT", type: "APARTMENT", price: 27_000, district: "İzmit", neighborhood: "Yahyakaptan", rooms: "2+1", gross: 95, net: 82, floor: 2, age: 12, lat: 40.7498, lng: 29.9601 },
    { title: "Başiskele'de Rezidans 1+1", purpose: "RENT", type: "APARTMENT", price: 22_000, district: "Başiskele", neighborhood: "Fatih", rooms: "1+1", gross: 72, net: 58, floor: 9, age: 4, lat: 40.7182, lng: 29.9312 },
    { title: "Körfez'de Kiralık 3+1", purpose: "RENT", type: "APARTMENT", price: 19_500, district: "Körfez", neighborhood: "Güney", rooms: "3+1", gross: 130, net: 112, floor: 4, age: 15, lat: 40.7723, lng: 29.7841 },
    { title: "Kartepe'de Kiralık Müstakil 4+1", purpose: "RENT", type: "HOUSE", price: 38_000, district: "Kartepe", neighborhood: "Uzuntarla", rooms: "4+1", gross: 220, net: 185, age: 7, lat: 40.7412, lng: 30.0623 },
    { title: "Kandıra Yolu'nda İmarlı Arsa", purpose: "SALE", type: "LAND", price: 5_200_000, district: "İzmit", neighborhood: "Durhasan", gross: 620, net: 620, lat: 40.8112, lng: 29.9523 },
    { title: "Karamürsel Sahilde Satılık Dükkan", purpose: "SALE", type: "COMMERCIAL", price: 4_100_000, district: "Karamürsel", neighborhood: "4 Temmuz", gross: 85, net: 78, floor: 0, age: 20, lat: 40.6912, lng: 29.6162 },
  ];

  const listings = [];
  for (let i = 0; i < L.length; i++) {
    const x = L[i];
    const listing = await prisma.listing.create({
      data: {
        tenantId: t,
        agentId: agents[i % 3],
        refCode: `EF-2026-${String(i + 1).padStart(4, "0")}`,
        title: x.title,
        purpose: x.purpose,
        type: x.type,
        status: x.status ?? "ACTIVE",
        price: P(x.price),
        city: "Kocaeli",
        district: x.district,
        neighborhood: x.neighborhood,
        lat: x.lat,
        lng: x.lng,
        rooms: x.rooms,
        grossArea: x.gross,
        netArea: x.net,
        floor: x.floor,
        buildingAge: x.age,
        heating: x.type === "LAND" ? null : "Kombi (Doğalgaz)",
        dues: x.type === "APARTMENT" ? P(1500 + (i % 5) * 700) : null,
        deedStatus: x.type === "LAND" ? "Arsa" : "Kat Mülkiyeti",
        creditEligible: i % 5 !== 4,
        inSite: [2, 3, 4, 8, 13].includes(i),
        description: "Detaylı bilgi ve yer gösterme için ofisimizle iletişime geçin.",
        media: {
          create: [{ url: PHOTOS[i % PHOTOS.length], key: `demo/${i}.jpg`, order: 0 }],
        },
      },
    });
    listings.push(listing);
  }

  // ── Lead'ler (10) ──
  const leadData = [
    { contactIdx: 0, purpose: "SALE", type: "APARTMENT", district: "İzmit", neighborhoods: ["Yahyakaptan", "Yenişehir"], rooms: "3+1", minPrice: 5_000_000, maxPrice: 7_000_000, needsCredit: true, source: "sahibinden" },
    { contactIdx: 1, purpose: "SALE", type: "APARTMENT", district: "Başiskele", neighborhoods: ["Yeniköy", "Fatih"], rooms: "4+1", minPrice: 7_000_000, maxPrice: 10_000_000, source: "referans" },
    { contactIdx: 3, purpose: "SALE", type: "APARTMENT", district: "Kartepe", neighborhoods: ["Köseköy"], rooms: "3+1", maxPrice: 4_800_000, needsCredit: true, source: "tabela" },
    { contactIdx: 4, purpose: "RENT", type: "APARTMENT", district: "İzmit", neighborhoods: ["Yahyakaptan"], rooms: "2+1", maxPrice: 30_000, source: "instagram" },
    { contactIdx: 6, purpose: "SALE", type: "APARTMENT", district: "İzmit", neighborhoods: ["Kemalpaşa"], rooms: "1+1", maxPrice: 2_700_000, source: "sahibinden" },
    { contactIdx: 7, purpose: "SALE", type: "VILLA", district: "Kartepe", neighborhoods: ["Maşukiye"], minPrice: 12_000_000, maxPrice: 18_000_000, source: "referans" },
    { contactIdx: 8, purpose: "RENT", type: "APARTMENT", district: "Körfez", neighborhoods: ["Güney"], rooms: "3+1", maxPrice: 22_000, source: "hepsiemlak" },
    { contactIdx: 9, purpose: "SALE", type: "APARTMENT", district: "İzmit", neighborhoods: ["Kabaoğlu"], rooms: "3.5+1", minPrice: 4_500_000, maxPrice: 6_500_000, needsCredit: true, source: "web" },
    { contactIdx: 1, purpose: "SALE", type: "LAND", district: "İzmit", neighborhoods: [], maxPrice: 6_000_000, source: "referans" },
    { contactIdx: 6, purpose: "RENT", type: "OFFICE", district: "İzmit", neighborhoods: ["Sanayi"], maxPrice: 65_000, source: "linkedin" },
  ] as const;

  const leads = [];
  for (const ld of leadData) {
    leads.push(
      await prisma.lead.create({
        data: {
          tenantId: t,
          contactId: contacts[ld.contactIdx].id,
          purpose: ld.purpose,
          type: ld.type,
          city: "Kocaeli",
          district: ld.district,
          neighborhoods: [...ld.neighborhoods],
          rooms: "rooms" in ld ? ld.rooms : undefined,
          minPrice: "minPrice" in ld && ld.minPrice ? P(ld.minPrice) : undefined,
          maxPrice: "maxPrice" in ld && ld.maxPrice ? P(ld.maxPrice) : undefined,
          needsCredit: "needsCredit" in ld ? !!ld.needsCredit : false,
          source: ld.source,
        },
      })
    );
  }

  // ── Fırsatlar (pipeline) ──
  const dealSeed: Array<{
    stage: "NEW" | "CONTACTED" | "VIEWING" | "OFFER" | "CONTRACT" | "CLOSED_WON";
    listingIdx: number;
    leadIdx: number;
    agentIdx: number;
    value: number;
  }> = [
    { stage: "VIEWING", listingIdx: 0, leadIdx: 0, agentIdx: 1, value: 6_450_000 },
    { stage: "OFFER", listingIdx: 2, leadIdx: 1, agentIdx: 0, value: 8_900_000 },
    { stage: "CONTACTED", listingIdx: 3, leadIdx: 2, agentIdx: 2, value: 4_350_000 },
    { stage: "NEW", listingIdx: 11, leadIdx: 3, agentIdx: 1, value: 22_000 },
    { stage: "CONTRACT", listingIdx: 4, leadIdx: 5, agentIdx: 0, value: 15_800_000 },
    { stage: "VIEWING", listingIdx: 8, leadIdx: 7, agentIdx: 2, value: 5_750_000 },
    { stage: "CLOSED_WON", listingIdx: 5, leadIdx: 4, agentIdx: 1, value: 2_400_000 },
    { stage: "CLOSED_WON", listingIdx: 12, leadIdx: 6, agentIdx: 2, value: 19_500 },
  ];

  for (const d of dealSeed) {
    const deal = await prisma.deal.create({
      data: {
        tenantId: t,
        stage: d.stage,
        listingId: listings[d.listingIdx].id,
        leadId: leads[d.leadIdx].id,
        contactId: leads[d.leadIdx].contactId,
        agentId: agents[d.agentIdx],
        value: P(d.value),
        closedAt: d.stage === "CLOSED_WON" ? daysFromNow(-7) : null,
      },
    });

    // Kapanan satışta komisyon: %4 (satış) / 1 kira bedeli (kiralama), danışman %50
    if (d.stage === "CLOSED_WON") {
      const gross = d.value > 100_000 ? d.value * 0.04 : d.value;
      await prisma.commission.create({
        data: {
          tenantId: t,
          dealId: deal.id,
          agentId: agents[d.agentIdx],
          gross: P(gross),
          agentShare: P(gross * 0.5),
          officeShare: P(gross * 0.5),
        },
      });
      await prisma.lead.update({
        where: { id: leads[d.leadIdx].id },
        data: { status: "CONVERTED" },
      });
      await prisma.listing.update({
        where: { id: listings[d.listingIdx].id },
        data: { status: d.value > 100_000 ? "SOLD" : "RENTED" },
      });
    }
  }

  // ── Randevular (bugün 3 + gelecek 3) ──
  const appts = [
    { title: "Yer gösterme — Yahyakaptan 3+1", start: todayAt(11, 0), listingIdx: 0, contactIdx: 0, agentIdx: 1 },
    { title: "Ofiste tapu evrak görüşmesi", start: todayAt(14, 30), listingIdx: 4, contactIdx: 7, agentIdx: 0 },
    { title: "Yer gösterme — Başiskele rezidans", start: todayAt(17, 0), listingIdx: 11, contactIdx: 4, agentIdx: 1 },
    { title: "Yer gösterme — Kabaoğlu 3.5+1", start: daysFromNow(1, 13), listingIdx: 8, contactIdx: 9, agentIdx: 2 },
    { title: "Fiyat değerleme ziyareti", start: daysFromNow(2, 10), listingIdx: 1, contactIdx: 2, agentIdx: 0 },
    { title: "Kira sözleşme imzası", start: daysFromNow(3, 15), listingIdx: 13, contactIdx: 8, agentIdx: 2 },
  ];
  for (const a of appts) {
    await prisma.appointment.create({
      data: {
        tenantId: t,
        title: a.title,
        startsAt: a.start,
        endsAt: new Date(a.start.getTime() + 60 * 60 * 1000),
        listingId: listings[a.listingIdx].id,
        contactId: contacts[a.contactIdx].id,
        agentId: agents[a.agentIdx],
      },
    });
  }

  // ── Aktivite akışı ──
  const acts = [
    { type: "CALL", body: "Ayşe Hanım arandı — Yahyakaptan için Cumartesi yer gösterme onaylandı.", userId: zeynep.id },
    { type: "NOTE", body: "Maşukiye villada mal sahibi fiyatta 500 bin esneyebilir.", userId: owner.id },
    { type: "WHATSAPP", body: "Başiskele deniz manzaralı için teklif dosyası Mehmet Bey'e iletildi.", userId: owner.id },
    { type: "STATUS_CHANGE", body: "İzmit merkez 1+1 SATILDI olarak işaretlendi.", userId: zeynep.id },
    { type: "MEETING", body: "Haftalık portföy toplantısı yapıldı — 3 yeni yetki hedefi.", userId: murat.id },
  ] as const;
  for (const a of acts) {
    await prisma.activity.create({
      data: { tenantId: t, type: a.type, body: a.body, userId: a.userId },
    });
  }

  console.log("✔ Atlas Gayrimenkul seed tamam:");
  console.log(`  Ofis: ${tenant.name} (${SLUG_ATLAS})`);
  console.log(`  Kullanıcı: 3 · İlan: ${listings.length} · Lead: ${leads.length} · Deal: ${dealSeed.length}`);
  console.log("  Giriş: sahibi@atlasgayrimenkul.com / demo1234");

  // ═══════════════════════════════════════════════════════════════════
  // VIP GAYRİMENKUL (ENES - DETAYLI TEST DATA)
  // ═══════════════════════════════════════════════════════════════════
  
  const vipTenant = await prisma.tenant.create({
    data: {
      name: "VIP Gayrimenkul",
      slug: SLUG_VIP,
      city: "İstanbul",
      district: "Kadıköy",
      phone: "+90 216 555 00 00",
      whatsapp: "+90 532 555 00 00",
      plan: "pro",
      proStartedAt: new Date("2024-01-01"),
      proExpiresAt: new Date("2027-12-31"),
      commissionRate: P(3.5),
      agentSharePct: 60,
      portalSahibinden: true,
      portalHepsiemlak: true,
      portalEmlakjet: true,
      feedToken: "vip-feed-2026",
      contractCompanyTitle: "VIP Gayrimenkul Danışmanlık Ltd. Şti.",
      contractRepresentative: "Enes Yılmaz",
      contractAddress: "Caferağa Mahallesi, Moda Caddesi No:123 Kadıköy/İstanbul",
      contractTaxNo: "1234567890",
      contractExtraClauses: "İşbu sözleşme 3 ay süreyle geçerlidir. Taraflar aralarında imzaladıkları bu sözleşmeye uyacaklarını kabul ve taahhüt ederler.",
      showcaseEnabled: true,
      showcaseTagline: "İstanbul'un en prestijli semtlerinde profesyonel emlak danışmanlığı",
      aboutTitle: "15 Yıllık Tecrübe ile Yanınızdayız",
      aboutText: "VIP Gayrimenkul olarak İstanbul'da emlak sektöründe 15 yıldır hizmet vermekteyiz. Kadıköy, Bostancı, Fenerbahçe ve çevresinde uzman kadromuzla müşterilerimize en iyi hizmeti sunuyoruz. Portföyümüzdeki her gayrimenkul detaylı bir şekilde incelenir ve size en uygun seçenekler sunulur.",
      visionText: "Güvenilir, şeffaf ve müşteri odaklı hizmet anlayışıyla emlak sektörünün lideri olmak.",
      aboutStats: [
        { value: "15", label: "Yıl Tecrübe" },
        { value: "850+", label: "Mutlu Müşteri" },
        { value: "1200+", label: "Tamamlanan İşlem" },
      ],
      showTeam: true,
    },
  });
  const vipT = vipTenant.id;

  // Kullanıcılar
  const [enes, ayse, mehmet, selin] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: vipT,
        name: "Enes Yılmaz",
        email: "enes@vipgayrimenkul.com",
        passwordHash,
        role: "OWNER",
        phone: "+90 532 555 00 01",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
      },
    }),
    prisma.user.create({
      data: {
        tenantId: vipT,
        name: "Ayşe Demir",
        email: "ayse@vipgayrimenkul.com",
        passwordHash,
        role: "BROKER",
        phone: "+90 532 555 00 02",
        avatarUrl: "https://i.pravatar.cc/150?img=5",
      },
    }),
    prisma.user.create({
      data: {
        tenantId: vipT,
        name: "Mehmet Kaya",
        email: "mehmet@vipgayrimenkul.com",
        passwordHash,
        role: "AGENT",
        phone: "+90 532 555 00 03",
        avatarUrl: "https://i.pravatar.cc/150?img=33",
      },
    }),
    prisma.user.create({
      data: {
        tenantId: vipT,
        name: "Selin Özkan",
        email: "selin@vipgayrimenkul.com",
        passwordHash,
        role: "AGENT",
        phone: "+90 532 555 00 04",
        avatarUrl: "https://i.pravatar.cc/150?img=9",
      },
    }),
  ]);
  const vipAgents = [enes.id, ayse.id, mehmet.id, selin.id];

  // Kişiler (25 adet - çeşitli tipler)
  const vipContactData: Array<{
    fullName: string;
    type: "BUYER" | "SELLER" | "TENANT_C" | "LANDLORD" | "OTHER";
    phone: string;
    email?: string;
    note?: string;
  }> = [
    { fullName: "Ahmet Yıldız", type: "BUYER", phone: "+90 555 100 01 01", email: "ahmet@example.com", note: "3+1 arıyor, kredisi hazır" },
    { fullName: "Zeynep Arslan", type: "BUYER", phone: "+90 555 100 01 02", email: "zeynep@example.com" },
    { fullName: "Can Özdemir", type: "SELLER", phone: "+90 555 100 01 03", note: "Caddebostan'da daire satacak" },
    { fullName: "Elif Şahin", type: "BUYER", phone: "+90 555 100 01 04", email: "elif@example.com" },
    { fullName: "Burak Çelik", type: "TENANT_C", phone: "+90 555 100 01 05", note: "Öğrenci, ebeveyn garantörü var" },
    { fullName: "Deniz Aydın", type: "LANDLORD", phone: "+90 555 100 01 06", email: "deniz@example.com" },
    { fullName: "Gizem Koç", type: "BUYER", phone: "+90 555 100 01 07" },
    { fullName: "Hakan Yılmaz", type: "BUYER", phone: "+90 555 100 01 08", email: "hakan@example.com", note: "Yatırım amaçlı arıyor" },
    { fullName: "İrem Doğan", type: "TENANT_C", phone: "+90 555 100 01 09" },
    { fullName: "Kerem Polat", type: "SELLER", phone: "+90 555 100 01 10", note: "Acil satış, takas olabilir" },
    { fullName: "Lale Kurt", type: "BUYER", phone: "+90 555 100 01 11", email: "lale@example.com" },
    { fullName: "Murat Aksoy", type: "LANDLORD", phone: "+90 555 100 01 12" },
    { fullName: "Nazlı Öztürk", type: "BUYER", phone: "+90 555 100 01 13", note: "Genç çift, ilk ev" },
    { fullName: "Okan Demirci", type: "OTHER", phone: "+90 555 100 01 14", email: "okan@example.com", note: "Müteahhit, proje ortaklığı" },
    { fullName: "Pınar Yıldırım", type: "TENANT_C", phone: "+90 555 100 01 15" },
    { fullName: "Rasim Kılıç", type: "SELLER", phone: "+90 555 100 01 16" },
    { fullName: "Seda Avcı", type: "BUYER", phone: "+90 555 100 01 17", email: "seda@example.com" },
    { fullName: "Tolga Eren", type: "BUYER", phone: "+90 555 100 01 18", note: "Ofis arıyor, şirket adına" },
    { fullName: "Ufuk Yaman", type: "LANDLORD", phone: "+90 555 100 01 19" },
    { fullName: "Volkan Tekin", type: "TENANT_C", phone: "+90 555 100 01 20" },
    { fullName: "Yelda Çakır", type: "BUYER", phone: "+90 555 100 01 21", email: "yelda@example.com" },
    { fullName: "Zafer Uzun", type: "SELLER", phone: "+90 555 100 01 22", note: "Villa satacak, acele yok" },
    { fullName: "Aylin Bayrak", type: "BUYER", phone: "+90 555 100 01 23" },
    { fullName: "Bora Güneş", type: "OTHER", phone: "+90 555 100 01 24", note: "Arsa yatırımcısı" },
    { fullName: "Canan Bulut", type: "TENANT_C", phone: "+90 555 100 01 25", email: "canan@example.com" },
  ];

  const vipContacts = await Promise.all(
    vipContactData.map((c) => prisma.contact.create({ data: { tenantId: vipT, ...c } }))
  );

  // İlanlar (20 adet - her tür ve durumdan)
  type VipListing = {
    title: string;
    purpose: "SALE" | "RENT";
    type: "APARTMENT" | "VILLA" | "LAND" | "COMMERCIAL" | "OFFICE" | "HOUSE";
    price: number;
    district: string;
    neighborhood: string;
    address?: string;
    rooms?: string;
    gross?: number;
    net?: number;
    floor?: number;
    totalFloors?: number;
    age?: number;
    status?: "ACTIVE" | "SOLD" | "RENTED" | "DRAFT" | "OPTIONED" | "PASSIVE";
    lat?: number;
    lng?: number;
    heating?: string;
    dues?: number;
    deedStatus?: string;
    creditEligible?: boolean;
    furnished?: boolean;
    inSite?: boolean;
    description: string;
    photoCount: number; // Her ilan için farklı fotoğraf sayısı
    hasVideo?: boolean;
    hasFloorplan?: boolean;
    hasTour360?: boolean;
  };

  const vipListings: VipListing[] = [
    {
      title: "Kadıköy Moda'da Deniz Manzaralı Lüks 4+1 Daire",
      purpose: "SALE",
      type: "APARTMENT",
      price: 18_500_000,
      district: "Kadıköy",
      neighborhood: "Moda",
      address: "Caferağa Mahallesi, Moda Caddesi No:45 D:8",
      rooms: "4+1",
      gross: 220,
      net: 185,
      floor: 8,
      totalFloors: 12,
      age: 5,
      status: "ACTIVE",
      lat: 40.9886,
      lng: 29.0253,
      heating: "Kombi (Doğalgaz)",
      dues: 3500,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: true,
      description: "Moda'nın kalbinde, denize sıfır konumda, her detayı düşünülmüş lüks bir yaşam alanı. Geniş terasından Adalar ve Marmara manzarası, yüksek tavanlar, akıllı ev sistemi. Site içinde kapalı otopark, 7/24 güvenlik, fitness center, çocuk oyun alanı.",
      photoCount: 12,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: true,
    },
    {
      title: "Fenerbahçe'de Bahçeli Müstakil Villa",
      purpose: "SALE",
      type: "VILLA",
      price: 45_000_000,
      district: "Kadıköy",
      neighborhood: "Fenerbahçe",
      address: "Fenerbahçe Mahallesi, Fener Yolu Sokak No:12",
      rooms: "6+2",
      gross: 480,
      net: 420,
      age: 8,
      status: "ACTIVE",
      lat: 40.9644,
      lng: 29.0372,
      heating: "Yerden Isıtma",
      deedStatus: "Kat Mülkiyeti",
      creditEligible: false,
      furnished: false,
      inSite: false,
      description: "Fenerbahçe'nin seçkin lokasyonunda, 650 m² özel bahçeli müstakil villa. Özel havuz, kamelya, BBQ alanı. 4 kat, akıllı ev sistemleri, jeneratör, özel güvenlik sistemi. Her katta WC, geniş mutfak ve teraslar.",
      photoCount: 15,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: false,
    },
    {
      title: "Bostancı'da Yatırımlık 2+1 Sıfır Daire",
      purpose: "SALE",
      type: "APARTMENT",
      price: 9_850_000,
      district: "Kadıköy",
      neighborhood: "Bostancı",
      rooms: "2+1",
      gross: 115,
      net: 98,
      floor: 6,
      totalFloors: 10,
      age: 0,
      status: "ACTIVE",
      lat: 40.9571,
      lng: 29.0918,
      heating: "Kombi (Doğalgaz)",
      dues: 1800,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: true,
      description: "Sıfır bina, 2026 yapımı. Bostancı merkezde, metrobüs ve marmaray bağlantısına yürüme mesafesinde. Modern mimari, geniş balkon, ankastre mutfak. Yüksek kira getirisi potansiyeli.",
      photoCount: 10,
      hasVideo: false,
      hasFloorplan: true,
      hasTour360: true,
    },
    {
      title: "Göztepe'de Satılık 3+1 Ferah Daire",
      purpose: "SALE",
      type: "APARTMENT",
      price: 12_300_000,
      district: "Kadıköy",
      neighborhood: "Göztepe",
      rooms: "3+1",
      gross: 145,
      net: 125,
      floor: 4,
      totalFloors: 8,
      age: 12,
      status: "SOLD",
      lat: 40.9755,
      lng: 29.0611,
      heating: "Kombi (Doğalgaz)",
      dues: 2200,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: false,
      description: "Göztepe'nin merkezinde, ulaşıma ve sosyal alanlara yakın. Ferah ve aydınlık, yeni tadilatlı. [SATILDI]",
      photoCount: 8,
      hasVideo: false,
      hasFloorplan: false,
    },
    {
      title: "Suadiye'de Lüks Rezidans 3+1",
      purpose: "RENT",
      type: "APARTMENT",
      price: 95_000,
      district: "Kadıköy",
      neighborhood: "Suadiye",
      rooms: "3+1",
      gross: 165,
      net: 140,
      floor: 12,
      totalFloors: 18,
      age: 3,
      status: "ACTIVE",
      lat: 40.9496,
      lng: 29.1086,
      heating: "Merkezi Sistem",
      dues: 4500,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: true,
      inSite: true,
      description: "A+ rezidans, tam eşyalı. Concierge, vale, kapalı havuz, spa, gym. Deniz manzarası, akıllı ev sistemi. Kısa dönem kiralamalara uygun değil, minimum 1 yıl.",
      photoCount: 11,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: true,
    },
    {
      title: "Caddebostan'da Cadde Üzeri Dükkan",
      purpose: "SALE",
      type: "COMMERCIAL",
      price: 8_500_000,
      district: "Kadıköy",
      neighborhood: "Caddebostan",
      gross: 95,
      net: 88,
      floor: 0,
      age: 25,
      status: "ACTIVE",
      lat: 40.9657,
      lng: 29.0536,
      heating: "Klima",
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: false,
      description: "Ana cadde üzeri, yüksek yaya trafiği. Kiracılı satış, yıllık kira getirisi %7. Cafe, market veya butik için ideal. 4 metre cephe.",
      photoCount: 7,
      hasVideo: false,
      hasFloorplan: true,
    },
    {
      title: "Acıbadem'de Prestijli Ofis Katı",
      purpose: "RENT",
      type: "OFFICE",
      price: 125_000,
      district: "Kadıköy",
      neighborhood: "Acıbadem",
      gross: 280,
      net: 240,
      floor: 3,
      totalFloors: 6,
      age: 8,
      status: "ACTIVE",
      lat: 41.0015,
      lng: 29.0541,
      heating: "VRV Klima",
      dues: 8500,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: false,
      furnished: false,
      inSite: true,
      description: "Modern iş merkezi, tam kat ofis. Open office düzenlenebilir veya 8 ayrı oda + toplantı odası. Yüksek tavan, merkezi klima, jeneratör, 7/24 güvenlik. 10 araçlık kapalı otopark.",
      photoCount: 9,
      hasVideo: true,
      hasFloorplan: true,
    },
    {
      title: "Kozyatağı'nda Satılık İmarlı Arsa",
      purpose: "SALE",
      type: "LAND",
      price: 35_000_000,
      district: "Kadıköy",
      neighborhood: "Kozyatağı",
      gross: 1200,
      net: 1200,
      age: 0,
      status: "ACTIVE",
      lat: 40.9831,
      lng: 29.0952,
      deedStatus: "Arsa",
      creditEligible: false,
      furnished: false,
      inSite: false,
      description: "E:2.00 imar, konut + ticaret. Ana yola cepheli, altyapı hazır. Proje için ideal konum. Otopark çözümü mevcut.",
      photoCount: 6,
      hasVideo: false,
      hasFloorplan: true,
    },
    {
      title: "Erenköy'de Kiralık Bahçeli Müstakil",
      purpose: "RENT",
      type: "HOUSE",
      price: 75_000,
      district: "Kadıköy",
      neighborhood: "Erenköy",
      rooms: "4+1",
      gross: 210,
      net: 180,
      age: 15,
      status: "RENTED",
      lat: 40.9681,
      lng: 29.0412,
      heating: "Kombi (Doğalgaz)",
      deedStatus: "Kat Mülkiyeti",
      creditEligible: false,
      furnished: false,
      inSite: false,
      description: "Sakin sokakta müstakil ev, 300 m² bahçe. Geniş aileler için ideal. [KİRALANDI]",
      photoCount: 8,
      hasVideo: false,
      hasFloorplan: false,
    },
    {
      title: "Fikirtepe'de Yeni Proje 1+1",
      purpose: "SALE",
      type: "APARTMENT",
      price: 6_200_000,
      district: "Kadıköy",
      neighborhood: "Fikirtepe",
      rooms: "1+1",
      gross: 72,
      net: 58,
      floor: 5,
      totalFloors: 15,
      age: 0,
      status: "ACTIVE",
      lat: 40.9794,
      lng: 29.0461,
      heating: "Merkezi Sistem",
      dues: 1200,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: true,
      description: "Kentsel dönüşüm projesi, sıfır. Marmaray istasyonuna 5 dk. Yatırım fırsatı, yüksek değer artış potansiyeli. Site içinde sosyal alan, güvenlik.",
      photoCount: 10,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: false,
    },
    {
      title: "Koşuyolu'nda Kiralık 2+1 Eşyalı",
      purpose: "RENT",
      type: "APARTMENT",
      price: 42_000,
      district: "Kadıköy",
      neighborhood: "Koşuyolu",
      rooms: "2+1",
      gross: 105,
      net: 90,
      floor: 3,
      totalFloors: 5,
      age: 18,
      status: "ACTIVE",
      lat: 40.9945,
      lng: 29.0371,
      heating: "Kombi (Doğalgaz)",
      dues: 1500,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: true,
      inSite: false,
      description: "Parkın karşısında, sakin konum. Tam eşyalı, beyaz eşya ve mobilya dahil. Metrobüs, hastane ve alışveriş merkezine yakın.",
      photoCount: 9,
      hasVideo: false,
      hasFloorplan: false,
    },
    {
      title: "Hasanpaşa'da Satılık 3+1 Tadilatla",
      purpose: "SALE",
      type: "APARTMENT",
      price: 11_800_000,
      district: "Kadıköy",
      neighborhood: "Hasanpaşa",
      rooms: "3+1",
      gross: 135,
      net: 115,
      floor: 2,
      totalFloors: 6,
      age: 35,
      status: "OPTIONED",
      lat: 40.9868,
      lng: 29.0192,
      heating: "Soba",
      dues: 1200,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: false,
      description: "Merkezi konum, tadilat gerekli. Geniş oda düzeni, yüksek tavan. İhtiyaca göre şekillendirme imkanı. [OPSİYONLANDI]",
      photoCount: 6,
      hasVideo: false,
      hasFloorplan: false,
    },
    {
      title: "Feneryolu'nda Modern 2.5+1",
      purpose: "SALE",
      type: "APARTMENT",
      price: 10_500_000,
      district: "Kadıköy",
      neighborhood: "Feneryolu",
      rooms: "2.5+1",
      gross: 122,
      net: 105,
      floor: 7,
      totalFloors: 9,
      age: 6,
      status: "ACTIVE",
      lat: 40.9652,
      lng: 29.0481,
      heating: "Kombi (Doğalgaz)",
      dues: 1900,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: true,
      description: "Denize 200 metre, modern tasarım. Geniş balkon, açık mutfak, lamine zemin. Site içinde spor salonu, çocuk parkı.",
      photoCount: 11,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: true,
    },
    {
      title: "Bahariye'de Kiralık Butik Ofis",
      purpose: "RENT",
      type: "OFFICE",
      price: 38_000,
      district: "Kadıköy",
      neighborhood: "Caferağa",
      gross: 85,
      net: 72,
      floor: 2,
      totalFloors: 4,
      age: 20,
      status: "ACTIVE",
      lat: 40.9858,
      lng: 29.0295,
      heating: "Klima",
      dues: 1800,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: false,
      furnished: false,
      inSite: false,
      description: "Bahariye Caddesi'nde, 3 oda + salon. Ajans, danışmanlık, muhasebe ofisi için ideal. Yenilenmiş bina.",
      photoCount: 7,
      hasVideo: false,
      hasFloorplan: true,
    },
    {
      title: "Rasimpaşa'da Yatırımlık 1+1",
      purpose: "SALE",
      type: "APARTMENT",
      price: 7_400_000,
      district: "Kadıköy",
      neighborhood: "Rasimpaşa",
      rooms: "1+1",
      gross: 68,
      net: 55,
      floor: 4,
      totalFloors: 5,
      age: 28,
      status: "DRAFT",
      lat: 40.9898,
      lng: 29.0212,
      heating: "Kombi (Doğalgaz)",
      dues: 850,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: false,
      description: "Merkezi konum, yatırım için uygun. Kiralık talep yüksek. [TASLAK - Fotoğraflar çekilecek]",
      photoCount: 4,
      hasVideo: false,
      hasFloorplan: false,
    },
    {
      title: "Selamiçeşme'de Satılık Arsa",
      purpose: "SALE",
      type: "LAND",
      price: 22_000_000,
      district: "Kadıköy",
      neighborhood: "Selamiçeşme",
      gross: 850,
      net: 850,
      age: 0,
      status: "PASSIVE",
      lat: 40.9432,
      lng: 29.1124,
      deedStatus: "Arsa",
      creditEligible: false,
      furnished: false,
      inSite: false,
      description: "İmarlı arsa, konut projesi için uygun. E:1.75. [PASİF İLAN]",
      photoCount: 5,
      hasVideo: false,
      hasFloorplan: true,
    },
    {
      title: "Zühtüpaşa'da Satılık 4+1 Dubleks",
      purpose: "SALE",
      type: "APARTMENT",
      price: 14_900_000,
      district: "Kadıköy",
      neighborhood: "Zühtüpaşa",
      rooms: "4+1",
      gross: 195,
      net: 168,
      floor: 5,
      totalFloors: 6,
      age: 10,
      status: "ACTIVE",
      lat: 40.9721,
      lng: 29.0561,
      heating: "Kombi (Doğalgaz)",
      dues: 2800,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: false,
      description: "Dubleks çatı katı, geniş teras. Modern mutfak, ana yatak odası banyolu. Deniz manzarası, sessiz sokak.",
      photoCount: 12,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: false,
    },
    {
      title: "Küçükyalı'da Denize Sıfır 5+1 Villa",
      purpose: "SALE",
      type: "VILLA",
      price: 62_000_000,
      district: "Maltepe",
      neighborhood: "Küçükyalı",
      rooms: "5+1",
      gross: 520,
      net: 460,
      age: 12,
      status: "ACTIVE",
      lat: 40.9281,
      lng: 29.1542,
      heating: "Yerden Isıtma + VRV Klima",
      deedStatus: "Kat Mülkiyeti",
      creditEligible: false,
      furnished: false,
      inSite: false,
      description: "Denize sıfır villa, özel plaj erişimi. 800 m² arsa, peyzajlı bahçe, havuz, jakuzi. Kapalı otopark 4 araç. Akıllı ev sistemi, jeneratör, güvenlik kamerası.",
      photoCount: 18,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: true,
    },
    {
      title: "Caferağa'da Kiralık Bahçe Katı 3+1",
      purpose: "RENT",
      type: "APARTMENT",
      price: 55_000,
      district: "Kadıköy",
      neighborhood: "Caferağa",
      rooms: "3+1",
      gross: 140,
      net: 120,
      floor: 0,
      totalFloors: 4,
      age: 40,
      status: "ACTIVE",
      lat: 40.9871,
      lng: 29.0281,
      heating: "Kombi (Doğalgaz)",
      dues: 1600,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: false,
      furnished: false,
      inSite: false,
      description: "Bahçe katı, 60 m² özel bahçe kullanımlı. Moda'nın içinde, yürüyüş mesafesinde her şey. Nostaljik bina, yüksek tavan.",
      photoCount: 9,
      hasVideo: false,
      hasFloorplan: false,
    },
    {
      title: "19 Mayıs'ta Yeni Projede 3.5+1",
      purpose: "SALE",
      type: "APARTMENT",
      price: 13_200_000,
      district: "Kadıköy",
      neighborhood: "19 Mayıs",
      rooms: "3.5+1",
      gross: 158,
      net: 135,
      floor: 9,
      totalFloors: 14,
      age: 1,
      status: "ACTIVE",
      lat: 40.9796,
      lng: 29.0724,
      heating: "Merkezi Sistem",
      dues: 2600,
      deedStatus: "Kat Mülkiyeti",
      creditEligible: true,
      furnished: false,
      inSite: true,
      description: "2025 teslim, A+ enerji sınıfı. Kapalı havuz, sauna, çocuk kulübü, jeneratör. Marmaray ve E-5'e yakın. Smart home altyapısı.",
      photoCount: 13,
      hasVideo: true,
      hasFloorplan: true,
      hasTour360: true,
    },
  ];

  const vipListingRecords = [];
  let photoIndex = 0;
  
  for (let i = 0; i < vipListings.length; i++) {
    const x = vipListings[i];
    
    // Her ilan için medya oluştur
    const mediaItems = [];
    
    // Fotoğraflar
    for (let p = 0; p < x.photoCount; p++) {
      mediaItems.push({
        url: PHOTOS[(photoIndex + p) % PHOTOS.length],
        key: `vip/listing-${i + 1}/photo-${p + 1}.jpg`,
        kind: "photo",
        order: p,
      });
    }
    photoIndex += x.photoCount;
    
    // Video ekle
    if (x.hasVideo) {
      mediaItems.push({
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        key: `vip/listing-${i + 1}/video.mp4`,
        kind: "video",
        order: x.photoCount,
      });
    }
    
    // Floor plan ekle
    if (x.hasFloorplan) {
      mediaItems.push({
        url: PHOTOS[0], // Örnek floor plan
        key: `vip/listing-${i + 1}/floorplan.jpg`,
        kind: "floorplan",
        order: x.photoCount + (x.hasVideo ? 1 : 0),
      });
    }
    
    // 360 Tour ekle
    if (x.hasTour360) {
      mediaItems.push({
        url: "https://my.matterport.com/show/?m=SxQL3iGyoDo",
        key: `vip/listing-${i + 1}/tour360`,
        kind: "tour360",
        order: x.photoCount + (x.hasVideo ? 1 : 0) + (x.hasFloorplan ? 1 : 0),
      });
    }

    const listing = await prisma.listing.create({
      data: {
        tenantId: vipT,
        agentId: vipAgents[i % 4],
        refCode: `VIP-2026-${String(i + 1).padStart(4, "0")}`,
        title: x.title,
        purpose: x.purpose,
        type: x.type,
        status: x.status ?? "ACTIVE",
        price: P(x.price),
        city: "İstanbul",
        district: x.district,
        neighborhood: x.neighborhood,
        address: x.address,
        lat: x.lat,
        lng: x.lng,
        rooms: x.rooms,
        grossArea: x.gross,
        netArea: x.net,
        floor: x.floor,
        totalFloors: x.totalFloors,
        buildingAge: x.age,
        heating: x.heating || null,
        dues: x.dues ? P(x.dues) : null,
        deedStatus: x.deedStatus || "Kat Mülkiyeti",
        creditEligible: x.creditEligible ?? true,
        furnished: x.furnished ?? false,
        inSite: x.inSite ?? false,
        description: x.description,
        media: {
          create: mediaItems,
        },
      },
    });
    vipListingRecords.push(listing);
  }

  console.log("✔ VIP Gayrimenkul ilanlar oluşturuldu");
  console.log(`  Toplam ilan: ${vipListingRecords.length}`);
  console.log(`  Toplam medya: ${vipListingRecords.length * 10} (ortalama)`);

  // Lead'ler (15 adet - çeşitli durumlar)
  const vipLeadData = [
    { contactIdx: 0, purpose: "SALE", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Moda", "Fenerbahçe"], rooms: "3+1", minPrice: 10_000_000, maxPrice: 15_000_000, needsCredit: true, source: "sahibinden", status: "MATCHED" },
    { contactIdx: 1, purpose: "SALE", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Bostancı", "Suadiye"], rooms: "4+1", minPrice: 15_000_000, maxPrice: 20_000_000, source: "referans", status: "OPEN" },
    { contactIdx: 3, purpose: "RENT", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Suadiye", "Caddebostan"], rooms: "3+1", maxPrice: 100_000, source: "hepsiemlak", status: "MATCHED" },
    { contactIdx: 4, purpose: "RENT", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Moda", "Kadıköy"], rooms: "2+1", maxPrice: 45_000, source: "instagram", status: "CONVERTED" },
    { contactIdx: 6, purpose: "SALE", type: "VILLA", district: "Kadıköy", neighborhoods: ["Fenerbahçe"], minPrice: 35_000_000, maxPrice: 50_000_000, source: "referans", status: "OPEN" },
    { contactIdx: 7, purpose: "SALE", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Göztepe", "Feneryolu"], rooms: "3+1", minPrice: 8_000_000, maxPrice: 12_000_000, needsCredit: true, source: "web", status: "MATCHED" },
    { contactIdx: 10, purpose: "RENT", type: "OFFICE", district: "Kadıköy", neighborhoods: ["Acıbadem", "Kozyatağı"], minPrice: 80_000, maxPrice: 150_000, source: "linkedin", status: "OPEN" },
    { contactIdx: 12, purpose: "SALE", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Bostancı", "Erenköy"], rooms: "2+1", maxPrice: 10_000_000, needsCredit: true, source: "sahibinden", status: "OPEN" },
    { contactIdx: 13, purpose: "SALE", type: "LAND", district: "Kadıköy", neighborhoods: ["Kozyatağı"], maxPrice: 40_000_000, source: "referans", status: "OPEN" },
    { contactIdx: 16, purpose: "SALE", type: "COMMERCIAL", district: "Kadıköy", neighborhoods: ["Caddebostan", "Moda"], maxPrice: 10_000_000, source: "emlakjet", status: "OPEN" },
    { contactIdx: 17, purpose: "RENT", type: "OFFICE", district: "Kadıköy", neighborhoods: ["Kadıköy", "Caferağa"], maxPrice: 50_000, source: "linkedin", status: "MATCHED" },
    { contactIdx: 20, purpose: "SALE", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Fikirtepe", "Hasanpaşa"], rooms: "1+1", maxPrice: 7_000_000, needsCredit: true, source: "tabela", status: "OPEN" },
    { contactIdx: 22, purpose: "SALE", type: "VILLA", district: "Maltepe", neighborhoods: ["Küçükyalı"], minPrice: 50_000_000, source: "referans", status: "OPEN" },
    { contactIdx: 19, purpose: "RENT", type: "APARTMENT", district: "Kadıköy", neighborhoods: ["Koşuyolu"], rooms: "2+1", maxPrice: 45_000, source: "sahibinden", status: "CONVERTED" },
    { contactIdx: 24, purpose: "RENT", type: "HOUSE", district: "Kadıköy", neighborhoods: ["Erenköy", "Suadiye"], rooms: "4+1", maxPrice: 80_000, source: "hepsiemlak", status: "LOST" },
  ] as const;

  const vipLeads = [];
  for (const ld of vipLeadData) {
    vipLeads.push(
      await prisma.lead.create({
        data: {
          tenantId: vipT,
          contactId: vipContacts[ld.contactIdx].id,
          purpose: ld.purpose,
          type: "type" in ld ? ld.type : undefined,
          city: "İstanbul",
          district: ld.district,
          neighborhoods: [...ld.neighborhoods],
          rooms: "rooms" in ld ? ld.rooms : undefined,
          minPrice: "minPrice" in ld && ld.minPrice ? P(ld.minPrice) : undefined,
          maxPrice: "maxPrice" in ld && ld.maxPrice ? P(ld.maxPrice) : undefined,
          needsCredit: "needsCredit" in ld ? !!ld.needsCredit : false,
          source: ld.source,
          status: ld.status || "OPEN",
        },
      })
    );
  }

  // Deal'ler (12 adet - tüm aşamalar)
  const vipDealSeed: Array<{
    stage: "NEW" | "CONTACTED" | "VIEWING" | "OFFER" | "CONTRACT" | "CLOSED_WON" | "CLOSED_LOST";
    listingIdx: number;
    leadIdx: number;
    agentIdx: number;
    value: number;
    lostReason?: string;
  }> = [
    { stage: "VIEWING", listingIdx: 0, leadIdx: 0, agentIdx: 0, value: 18_500_000 },
    { stage: "OFFER", listingIdx: 1, leadIdx: 5, agentIdx: 1, value: 43_000_000 },
    { stage: "CONTRACT", listingIdx: 4, leadIdx: 2, agentIdx: 2, value: 95_000 },
    { stage: "CLOSED_WON", listingIdx: 3, leadIdx: 6, agentIdx: 3, value: 12_300_000 },
    { stage: "CLOSED_WON", listingIdx: 8, leadIdx: 3, agentIdx: 0, value: 75_000 },
    { stage: "CONTACTED", listingIdx: 2, leadIdx: 7, agentIdx: 1, value: 9_850_000 },
    { stage: "VIEWING", listingIdx: 12, leadIdx: 5, agentIdx: 2, value: 10_500_000 },
    { stage: "NEW", listingIdx: 10, leadIdx: 13, agentIdx: 3, value: 42_000 },
    { stage: "OFFER", listingIdx: 16, leadIdx: 0, agentIdx: 0, value: 14_900_000 },
    { stage: "VIEWING", listingIdx: 6, leadIdx: 9, agentIdx: 1, value: 125_000 },
    { stage: "CLOSED_LOST", listingIdx: 14, leadIdx: 11, agentIdx: 2, value: 7_400_000, lostReason: "Finansman sağlanamadı" },
    { stage: "CLOSED_LOST", listingIdx: 18, leadIdx: 14, agentIdx: 3, value: 55_000, lostReason: "Başka lokasyon tercih etti" },
  ];

  const vipDeals = [];
  for (const d of vipDealSeed) {
    const deal = await prisma.deal.create({
      data: {
        tenantId: vipT,
        stage: d.stage,
        listingId: vipListingRecords[d.listingIdx].id,
        leadId: vipLeads[d.leadIdx].id,
        contactId: vipLeads[d.leadIdx].contactId,
        agentId: vipAgents[d.agentIdx],
        value: P(d.value),
        closedAt: ["CLOSED_WON", "CLOSED_LOST"].includes(d.stage) ? daysFromNow(-Math.floor(Math.random() * 30)) : null,
        lostReason: d.lostReason,
      },
    });
    vipDeals.push(deal);

    // Kapanan başarılı işlemler için komisyon
    if (d.stage === "CLOSED_WON") {
      const isRent = d.value < 1_000_000;
      const gross = isRent ? d.value : d.value * 0.035; // Kirada 1 ay, satışta %3.5
      const agentShare = gross * 0.6; // %60 danışman payı
      
      await prisma.commission.create({
        data: {
          tenantId: vipT,
          dealId: deal.id,
          agentId: vipAgents[d.agentIdx],
          gross: P(gross),
          agentShare: P(agentShare),
          officeShare: P(gross - agentShare),
          paidAt: Math.random() > 0.5 ? daysFromNow(-7) : null,
        },
      });
    }
  }

  // Randevular (18 adet - geçmiş, bugün, gelecek)
  const vipAppointments = [
    // Geçmiş randevular
    { title: "Yer gösterme - Moda 4+1", start: daysFromNow(-5, 10), status: "DONE", listingIdx: 0, contactIdx: 0, agentIdx: 0, note: "Müşteri beğendi, 2. görüşme planlandı" },
    { title: "Fenerbahçe villa gezisi", start: daysFromNow(-4, 14), status: "DONE", listingIdx: 1, contactIdx: 6, agentIdx: 1 },
    { title: "Ofiste sözleşme imzası", start: daysFromNow(-3, 11), status: "DONE", listingIdx: 3, contactIdx: 1, agentIdx: 3, note: "Satış tamamlandı" },
    { title: "Suadiye rezidans görüşme", start: daysFromNow(-2, 15), status: "CANCELLED", listingIdx: 4, contactIdx: 3, agentIdx: 2, note: "Müşteri iptal etti" },
    { title: "Göztepe daire yer gösterme", start: daysFromNow(-1, 13), status: "DONE", listingIdx: 3, contactIdx: 7, agentIdx: 3 },
    
    // Bugünkü randevular
    { title: "Bostancı 2+1 yer gösterme", start: todayAt(10, 30), status: "SCHEDULED", listingIdx: 2, contactIdx: 12, agentIdx: 1 },
    { title: "Acıbadem ofis görüşmesi", start: todayAt(14, 0), status: "SCHEDULED", listingIdx: 6, contactIdx: 17, agentIdx: 0, note: "Kat planlarını hazırla" },
    { title: "Caddebostan dükkan teklif sunumu", start: todayAt(16, 30), status: "SCHEDULED", listingIdx: 5, contactIdx: 16, agentIdx: 2 },
    { title: "Haftalık ekip toplantısı", start: todayAt(18, 0), status: "SCHEDULED", listingIdx: null, contactIdx: null, agentIdx: 0 },
    
    // Gelecek randevular
    { title: "Feneryolu daire yer gösterme", start: daysFromNow(1, 11), status: "SCHEDULED", listingIdx: 12, contactIdx: 20, agentIdx: 3 },
    { title: "Kozyatağı arsa inceleme", start: daysFromNow(1, 15), status: "SCHEDULED", listingIdx: 7, contactIdx: 13, agentIdx: 0, note: "İmar planını yanına al" },
    { title: "Küçükyalı villa yer gösterme", start: daysFromNow(2, 10), status: "SCHEDULED", listingIdx: 17, contactIdx: 22, agentIdx: 1, note: "VIP müşteri" },
    { title: "Kiralama sözleşmesi", start: daysFromNow(2, 14), status: "SCHEDULED", listingIdx: 8, contactIdx: 4, agentIdx: 0 },
    { title: "Fikirtepe proje tanıtımı", start: daysFromNow(3, 11), status: "SCHEDULED", listingIdx: 9, contactIdx: 20, agentIdx: 2 },
    { title: "Yetki belgesi imza", start: daysFromNow(4, 10), status: "SCHEDULED", listingIdx: 16, contactIdx: 2, agentIdx: 3 },
    { title: "19 Mayıs proje görüşme", start: daysFromNow(5, 13), status: "SCHEDULED", listingIdx: 19, contactIdx: 1, agentIdx: 1 },
    { title: "Koşuyolu kiralama", start: daysFromNow(6, 15), status: "SCHEDULED", listingIdx: 10, contactIdx: 19, agentIdx: 0 },
    { title: "Bahariye ofis görüşme", start: daysFromNow(7, 14), status: "SCHEDULED", listingIdx: 13, contactIdx: 17, agentIdx: 2 },
  ];

  const vipCreatedAppointments = [];
  for (const a of vipAppointments) {
    vipCreatedAppointments.push(
      await prisma.appointment.create({
        data: {
          tenantId: vipT,
          title: a.title,
          status: a.status as any,
          startsAt: a.start,
          endsAt: new Date(a.start.getTime() + 90 * 60 * 1000), // 90 dakika
          listingId: a.listingIdx !== null && a.listingIdx !== undefined ? vipListingRecords[a.listingIdx].id : null,
          contactId: a.contactIdx !== null && a.contactIdx !== undefined ? vipContacts[a.contactIdx].id : null,
          agentId: vipAgents[a.agentIdx],
          note: a.note,
        },
      }),
    );
  }

  // Sözleşmeler (8 adet - farklı tipler)
  const vipContracts = [
    { type: "AUTHORIZATION", listingIdx: 0, contactIdx: 2, dealIdx: null, signedAt: daysFromNow(-60), expiresAt: daysFromNow(30) },
    { type: "AUTHORIZATION", listingIdx: 1, contactIdx: 21, dealIdx: null, signedAt: daysFromNow(-45), expiresAt: daysFromNow(45) },
    { type: "VIEWING_FORM", listingIdx: 0, contactIdx: 0, dealIdx: 0, signedAt: daysFromNow(-5) },
    { type: "VIEWING_FORM", listingIdx: 1, contactIdx: 6, dealIdx: 1, signedAt: daysFromNow(-4) },
    { type: "SALE_CONTRACT", listingIdx: 3, contactIdx: 1, dealIdx: 3, signedAt: daysFromNow(-3) },
    { type: "RENT_CONTRACT", listingIdx: 8, contactIdx: 4, dealIdx: 4, signedAt: daysFromNow(-2) },
    { type: "AUTHORIZATION", listingIdx: 16, contactIdx: 2, dealIdx: null, signedAt: daysFromNow(-30), expiresAt: daysFromNow(60) },
    { type: "RENT_CONTRACT", listingIdx: 4, contactIdx: 3, dealIdx: 2, signedAt: daysFromNow(-10) },
  ];

  for (const c of vipContracts) {
    await prisma.contract.create({
      data: {
        tenantId: vipT,
        type: c.type as any,
        listingId: vipListingRecords[c.listingIdx].id,
        contactId: vipContacts[c.contactIdx].id,
        dealId: c.dealIdx !== null ? vipDeals[c.dealIdx].id : null,
        signedAt: c.signedAt,
        expiresAt: c.expiresAt || null,
        fileUrl: `https://r2.example.com/contracts/vip-contract-${Math.random().toString(36).substring(7)}.pdf`,
        fileKey: `contracts/vip-contract-${Math.random().toString(36).substring(7)}.pdf`,
      },
    });
  }

  // Aktiviteler (25 adet - son 7 gün)
  const vipActivities = [
    { type: "CALL", userId: enes.id, entity: "contact", entityId: vipContacts[0].id, body: "Ahmet Bey arandı - Moda 4+1 için yer gösterme randevusu ayarlandı", createdAt: daysFromNow(-6, 9) },
    { type: "NOTE", userId: ayse.id, entity: "listing", entityId: vipListingRecords[1].id, body: "Fenerbahçe villa - Mal sahibi 2M indirim yapabilir", createdAt: daysFromNow(-6, 11) },
    { type: "WHATSAPP", userId: mehmet.id, entity: "deal", entityId: vipDeals[0].id, body: "Moda daireye ilgili müşteriye WhatsApp ile fotoğraflar gönderildi", createdAt: daysFromNow(-5, 14) },
    { type: "STATUS_CHANGE", userId: enes.id, entity: "listing", entityId: vipListingRecords[3].id, body: "Göztepe 3+1 durumu SATILDI olarak değiştirildi", createdAt: daysFromNow(-5, 16) },
    { type: "MEETING", userId: ayse.id, entity: "deal", entityId: vipDeals[3].id, body: "Müşteri ile ofiste buluşuldu - Sözleşme imzalandı", createdAt: daysFromNow(-4, 11) },
    { type: "EMAIL", userId: selin.id, entity: "lead", entityId: vipLeads[1].id, body: "Zeynep Hanım'a portföy katalogu e-posta ile gönderildi", createdAt: daysFromNow(-4, 15) },
    { type: "CALL", userId: mehmet.id, entity: "contact", entityId: vipContacts[17].id, body: "Tolga Bey arandı - Ofis ihtiyacı için Acıbadem lokasyonu önerildi", createdAt: daysFromNow(-3, 10) },
    { type: "NOTE", userId: enes.id, entity: "listing", entityId: vipListingRecords[17].id, body: "Küçükyalı villa - Havuz bakımı yapılacak, fotoğraflar güncellenecek", createdAt: daysFromNow(-3, 13) },
    { type: "WHATSAPP", userId: selin.id, entity: "contact", entityId: vipContacts[3].id, body: "Elif Hanım'a Bostancı 2+1 video turu gönderildi", createdAt: daysFromNow(-2, 9) },
    { type: "STATUS_CHANGE", userId: ayse.id, entity: "deal", entityId: vipDeals[2].id, body: "Suadiye rezidans kiralama fırsatı SÖZLEŞME aşamasına geçti", createdAt: daysFromNow(-2, 14) },
    { type: "MEETING", userId: mehmet.id, entity: "contact", entityId: vipContacts[13].id, body: "Okan Bey ile arsa projesi görüşmesi yapıldı", createdAt: daysFromNow(-1, 11) },
    { type: "CALL", userId: enes.id, entity: "lead", entityId: vipLeads[7].id, body: "Yeni lead - Fikirtepe'de 1+1 arayan müşteri kaydedildi", createdAt: daysFromNow(-1, 15) },
    { type: "NOTE", userId: selin.id, entity: "listing", entityId: vipListingRecords[10].id, body: "Koşuyolu kiralık - Eşya envanteri güncellendi", createdAt: todayAt(9, 0) },
    { type: "WHATSAPP", userId: ayse.id, entity: "deal", entityId: vipDeals[6].id, body: "Feneryolu 2.5+1 için teklif dosyası WhatsApp ile iletildi", createdAt: todayAt(10, 30) },
    { type: "EMAIL", userId: mehmet.id, entity: "contact", entityId: vipContacts[22].id, body: "Zafer Bey'e villa portföyü detaylı sunumu gönderildi", createdAt: todayAt(11, 45) },
    { type: "CALL", userId: enes.id, entity: "contact", entityId: vipContacts[7].id, body: "Hakan Bey arandı - Yatırımlık opsiyonlar konuşuldu", createdAt: todayAt(13, 15) },
    { type: "STATUS_CHANGE", userId: selin.id, entity: "listing", entityId: vipListingRecords[8].id, body: "Erenköy müstakil durumu KİRALANDI olarak değiştirildi", createdAt: todayAt(14, 30) },
    { type: "NOTE", userId: ayse.id, entity: "deal", entityId: vipDeals[1].id, body: "Fenerbahçe villa - Müşteri 43M teklif verdi, mal sahibiyle görüşülecek", createdAt: todayAt(15, 0) },
    { type: "MEETING", userId: enes.id, entity: null, entityId: null, body: "Haftalık ekip toplantısı - 5 yeni ilan hedefi belirlendi", createdAt: todayAt(18, 0) },
    { type: "WHATSAPP", userId: mehmet.id, entity: "contact", entityId: vipContacts[20].id, body: "Yelda Hanım'a 19 Mayıs projesinin detayları gönderildi", createdAt: daysFromNow(-6, 16) },
    { type: "CALL", userId: selin.id, entity: "lead", entityId: vipLeads[12].id, body: "Küçükyalı villa arayanlar için yeni lead oluşturuldu", createdAt: daysFromNow(-5, 10) },
    { type: "NOTE", userId: enes.id, entity: "listing", entityId: vipListingRecords[5].id, body: "Caddebostan dükkan - Kiracı 6 ay sonra çıkacak", createdAt: daysFromNow(-4, 12) },
    { type: "EMAIL", userId: ayse.id, entity: "contact", entityId: vipContacts[16].id, body: "Seda Hanım'a uygun kredili konut seçenekleri gönderildi", createdAt: daysFromNow(-3, 14) },
    { type: "STATUS_CHANGE", userId: mehmet.id, entity: "listing", entityId: vipListingRecords[11].id, body: "Hasanpaşa 3+1 durumu OPSİYONLANDI olarak değiştirildi", createdAt: daysFromNow(-2, 11) },
    { type: "CALL", userId: selin.id, entity: "contact", entityId: vipContacts[24].id, body: "Canan Hanım arandı - Koşuyolu kiralık için randevu ayarlandı", createdAt: daysFromNow(-1, 13) },
  ];

  for (const a of vipActivities) {
    await prisma.activity.create({
      data: {
        tenantId: vipT,
        type: a.type as any,
        userId: a.userId,
        entity: a.entity,
        entityId: a.entityId,
        body: a.body,
        createdAt: a.createdAt,
      },
    });
  }

  // Bildirimler (12 adet - okunmuş ve okunmamış)
  const vipNotifications = [
    { userId: enes.id, title: "Yeni lead oluşturuldu", body: "Ahmet Yıldız - Kadıköy'de 3+1 arıyor", href: notificationLinks.contact(vipLeads[0].contactId!), category: "lead", severity: "action", readAt: daysFromNow(-5) },
    { userId: ayse.id, title: "Yeni eşleşme bulundu", body: "Moda 4+1 ilanınız Ahmet Yıldız'ın aramasıyla eşleşti", href: notificationLinks.listing(vipListingRecords[0].id), category: "match", severity: "action", readAt: daysFromNow(-4) },
    { userId: enes.id, title: "Fırsat güncellendi", body: "Göztepe 3+1 - SÖZLEŞMEaşamasına geçti", href: notificationLinks.deal(vipDeals[3].id), category: "deal", severity: "info", readAt: daysFromNow(-3) },
    { userId: selin.id, title: "Randevu hatırlatması", body: "Bugün saat 14:00 - Bostancı 2+1 yer gösterme", href: notificationLinks.appointment({ date: dateParam(todayAt(14, 0)), id: vipCreatedAppointments[6].id }), category: "appointment", severity: "urgent", readAt: null },
    { userId: mehmet.id, title: "Yetki belgesi sona eriyor", body: "Zühtüpaşa 4+1 - Yetki belgesi 30 gün içinde sona erecek", href: notificationLinks.finansContracts(), category: "contract", severity: "action", readAt: null },
    { userId: enes.id, title: "Yeni mesaj", body: "Vitrin ziyaretçisinden mesaj geldi", href: notificationLinks.chat("v_001"), category: "chat", severity: "action", readAt: todayAt(9, 0) },
    { userId: ayse.id, title: "Fırsat kaybedildi", body: "Rasimpaşa 1+1 - Finansman sağlanamadı", href: notificationLinks.deal(vipDeals[10].id), category: "deal", severity: "info", readAt: daysFromNow(-2) },
    { userId: mehmet.id, title: "İlan pasif duruma geçti", body: "Selamiçeşme arsa pasif duruma alındı", href: notificationLinks.listing(vipListingRecords[15].id), category: "system", severity: "info", readAt: daysFromNow(-1) },
    { userId: selin.id, title: "Komisyon ödendi", body: "Göztepe 3+1 satışından komisyon hesabınıza yatırıldı", href: notificationLinks.finans(), category: "system", severity: "info", readAt: null },
    { userId: enes.id, title: "Randevu yaklaşıyor", body: "2 saat sonra - Acıbadem ofis görüşmesi", href: notificationLinks.appointment({ date: dateParam(todayAt(14, 0)), id: vipCreatedAppointments[6].id }), category: "appointment", severity: "urgent", readAt: null },
    { userId: ayse.id, title: "Yeni teklif", body: "Fenerbahçe villa için 43M teklif geldi", href: notificationLinks.deal(vipDeals[1].id), category: "deal", severity: "urgent", readAt: null },
    { userId: mehmet.id, title: "Portal yayını aktif", body: "19 Mayıs 3.5+1 sahibinden.com'da yayınlandı", href: notificationLinks.listing(vipListingRecords[19].id), category: "system", severity: "info", readAt: todayAt(8, 0) },
  ];

  for (const n of vipNotifications) {
    await prisma.notification.create({
      data: {
        tenantId: vipT,
        userId: n.userId,
        title: n.title,
        body: n.body,
        href: n.href,
        category: n.category,
        severity: n.severity,
        readAt: n.readAt,
      },
    });
  }

  // Mesajlar (vitrin chat - 3 farklı oturum)
  const vipMessages = [
    // Oturum 1 - İlanla ilgili soru
    { sessionId: "v_001", senderName: "Mehmet", body: "Merhaba, Moda'daki 4+1 daire hala müsait mi?", createdAt: daysFromNow(-2, 10) },
    { sessionId: "v_001", senderId: enes.id, body: "Merhaba! Evet müsait. Size detaylı bilgi verebilirim.", createdAt: daysFromNow(-2, 10, 2) },
    { sessionId: "v_001", senderName: "Mehmet", body: "Krediye uygun mu?", createdAt: daysFromNow(-2, 10, 5) },
    { sessionId: "v_001", senderId: enes.id, body: "Evet, krediye uygun. Bankalarla anlaşmalıyız, süreç konusunda destek sağlayabiliriz.", createdAt: daysFromNow(-2, 10, 7) },
    
    // Oturum 2 - Genel bilgi
    { sessionId: "v_002", senderName: "Ayşe", body: "Kadıköy'de kiralık daireleriniz var mı?", createdAt: daysFromNow(-1, 14) },
    { sessionId: "v_002", senderId: ayse.id, body: "Merhaba! Evet, birçok kiralık dairemiz var. Ne tür bir daire arıyorsunuz?", createdAt: daysFromNow(-1, 14, 1) },
    { sessionId: "v_002", senderName: "Ayşe", body: "2+1, eşyalı olursa iyi olur", createdAt: daysFromNow(-1, 14, 3) },
    { sessionId: "v_002", senderId: ayse.id, body: "Koşuyolu'nda tam eşyalı 2+1'imiz var. Link gönderiyorum.", createdAt: daysFromNow(-1, 14, 5) },
    
    // Oturum 3 - Bugün
    { sessionId: "v_003", senderName: "Can", body: "Villa portföyünüz var mı?", createdAt: todayAt(11, 0) },
    { sessionId: "v_003", senderId: mehmet.id, body: "Merhaba! Evet, Fenerbahçe ve Küçükyalı'da villalarımız var.", createdAt: todayAt(11, 2) },
    { sessionId: "v_003", senderName: "Can", body: "Fiyat aralığı ne kadar?", createdAt: todayAt(11, 5) },
    { sessionId: "v_003", senderId: mehmet.id, body: "Fenerbahçe'de 45M, Küçükyalı'da 62M. İkisi de denize sıfır konumda.", createdAt: todayAt(11, 7) },
    
    // Ekip içi mesajlar
    { sessionId: "TEAM", senderId: enes.id, body: "Bugünkü toplantı saat 18:00'de", createdAt: todayAt(9, 0) },
    { sessionId: "TEAM", senderId: ayse.id, body: "Tamam, oradayım", createdAt: todayAt(9, 15) },
    { sessionId: "TEAM", senderId: mehmet.id, body: "Ben de katılacağım", createdAt: todayAt(9, 30) },
  ];

  for (const m of vipMessages) {
    await prisma.message.create({
      data: {
        tenantId: vipT,
        sessionId: m.sessionId,
        senderId: m.senderId || null,
        senderName: m.senderName || null,
        body: m.body,
        createdAt: m.createdAt,
      },
    });
  }

  // İlan olayları (vitrin funnel - son 30 gün)
  const vipListingEvents: Array<{
    listingIdx: number;
    type: "IMPRESSION" | "VIEW" | "CLICK" | "CONTACT" | "CHAT";
    sessionId: string;
    source: string;
    daysAgo: number;
  }> = [];

  // Her aktif ilan için olaylar oluştur
  for (let i = 0; i < vipListingRecords.length; i++) {
    if (["ACTIVE", "OPTIONED"].includes(vipListingRecords[i].status)) {
      const impressionCount = Math.floor(Math.random() * 50) + 20;
      const viewCount = Math.floor(impressionCount * 0.3);
      const clickCount = Math.floor(viewCount * 0.2);
      const contactCount = Math.floor(clickCount * 0.1);

      for (let d = 0; d < 30; d++) {
        const dailyImpressions = Math.floor(impressionCount / 30);
        const dailyViews = Math.floor(viewCount / 30);
        
        for (let imp = 0; imp < dailyImpressions; imp++) {
          vipListingEvents.push({
            listingIdx: i,
            type: "IMPRESSION",
            sessionId: `v_${Math.random().toString(36).substring(7)}`,
            source: ["vitrin", "feed:sahibinden", "feed:hepsiemlak"][Math.floor(Math.random() * 3)],
            daysAgo: d,
          });
        }
        
        for (let v = 0; v < dailyViews; v++) {
          const sessionId = `v_${Math.random().toString(36).substring(7)}`;
          vipListingEvents.push({
            listingIdx: i,
            type: "VIEW",
            sessionId,
            source: "vitrin",
            daysAgo: d,
          });
          
          // Bazı view'lar click'e dönüşür
          if (Math.random() < 0.2) {
            vipListingEvents.push({
              listingIdx: i,
              type: "CLICK",
              sessionId,
              source: "vitrin",
              daysAgo: d,
            });
          }
        }
      }
    }
  }

  // Olayları veritabanına kaydet
  for (const evt of vipListingEvents) {
    await prisma.listingEvent.create({
      data: {
        tenantId: vipT,
        listingId: vipListingRecords[evt.listingIdx].id,
        type: evt.type,
        sessionId: evt.sessionId,
        source: evt.source,
        durationMs: evt.type === "VIEW" ? Math.floor(Math.random() * 180000) + 30000 : null,
        createdAt: daysFromNow(-evt.daysAgo, Math.floor(Math.random() * 24)),
      },
    });
  }

  // Günlük istatistikler (son 30 gün için özet)
  for (let i = 0; i < vipListingRecords.length; i++) {
    if (["ACTIVE", "OPTIONED"].includes(vipListingRecords[i].status)) {
      for (let d = 0; d < 30; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);

        await prisma.listingDailyStat.create({
          data: {
            tenantId: vipT,
            listingId: vipListingRecords[i].id,
            day: date,
            impressions: Math.floor(Math.random() * 30) + 10,
            views: Math.floor(Math.random() * 15) + 3,
            clicks: Math.floor(Math.random() * 5),
            contacts: Math.floor(Math.random() * 2),
            chats: Math.random() < 0.3 ? 1 : 0,
          },
        });
      }
    }
  }

  // Insight'lar (eylem önerileri)
  const vipInsights = [
    {
      listingId: vipListingRecords[0].id,
      rule: "HIGH_INTEREST",
      severity: "ACTION" as const,
      title: "Yüksek ilgi gören ilan",
      body: "Moda 4+1 ilanınız son 7 günde 45 görüntüleme aldı. Fiyat artışı değerlendirilebilir.",
      data: { views: 45, clicks: 9 },
    },
    {
      listingId: vipListingRecords[14].id,
      rule: "STALE_LISTING",
      severity: "URGENT" as const,
      title: "Uzun süredir aktif ilan",
      body: "Rasimpaşa 1+1 60 gündür aktif ancak düşük ilgi görüyor. Fiyat revizyonu önerilir.",
      data: { daysActive: 60, avgViews: 2 },
    },
    {
      listingId: vipListingRecords[16].id,
      rule: "AUTH_EXPIRING",
      severity: "ACTION" as const,
      title: "Yetki belgesi sona eriyor",
      body: "Zühtüpaşa 4+1 için yetki belgesi 30 gün içinde sona erecek. Mal sahibiyle görüşün.",
      data: { expiresAt: daysFromNow(30) },
    },
    {
      listingId: vipListingRecords[2].id,
      rule: "PRICE_BELOW_MARKET",
      severity: "INFO" as const,
      title: "Piyasa altı fiyat",
      body: "Bostancı 2+1 benzer ilanlardan %8 daha ucuz. Hızlı satış beklenir.",
      data: { marketAvg: 10_700_000, yourPrice: 9_850_000 },
    },
    {
      listingId: vipListingRecords[17].id,
      rule: "HIGH_VALUE",
      severity: "ACTION" as const,
      title: "Yüksek değerli ilan",
      body: "Küçükyalı villa portföyünüzün en değerli ilanı. Özel pazarlama stratejisi önerilir.",
      data: { value: 62_000_000 },
    },
    {
      listingId: null,
      rule: "NEW_LEADS",
      severity: "INFO" as const,
      title: "Bu hafta 3 yeni lead",
      body: "Bu hafta 3 yeni talep kaydedildi. Takip edilmesi gereken leadler var.",
      data: { newLeads: 3 },
    },
  ];

  for (const ins of vipInsights) {
    await prisma.insight.create({
      data: {
        tenantId: vipT,
        listingId: ins.listingId,
        rule: ins.rule,
        severity: ins.severity,
        title: ins.title,
        body: ins.body,
        data: ins.data,
      },
    });
  }

  console.log("\n✔ VIP Gayrimenkul (Enes) seed tamam!");
  console.log(`  Ofis: ${vipTenant.name} (${SLUG_VIP})`);
  console.log(`  Kullanıcılar: 4 (${enes.name}, ${ayse.name}, ${mehmet.name}, ${selin.name})`);
  console.log(`  Kişiler: ${vipContacts.length}`);
  console.log(`  İlanlar: ${vipListingRecords.length}`);
  console.log(`  Toplam Medya: ~${vipListingRecords.reduce((sum, l) => sum + 10, 0)} (foto, video, plan, 360)`);
  console.log(`  Lead'ler: ${vipLeads.length}`);
  console.log(`  Fırsatlar: ${vipDeals.length}`);
  console.log(`  Randevular: ${vipAppointments.length}`);
  console.log(`  Sözleşmeler: ${vipContracts.length}`);
  console.log(`  Aktiviteler: ${vipActivities.length}`);
  console.log(`  Bildirimler: ${vipNotifications.length}`);
  console.log(`  Mesajlar: ${vipMessages.length}`);
  console.log(`  İlan Olayları: ${vipListingEvents.length}`);
  console.log(`  Insight'lar: ${vipInsights.length}`);
  console.log(`\n  🔑 Giriş: enes@vipgayrimenkul.com / demo1234`);
  console.log(`  🌐 Vitrin: /ofis/${SLUG_VIP}\n`);

  await seedGaleri();
  await seedPrestij();
}

/**
 * ── GaleriFlow (AUTO_DEALER) demo galerisi ──
 * Araç vitrini + araç kriterli lead formu + kira widget'ı için kompakt veri seti.
 */
async function seedGaleri() {
  const passwordHash = await hash("demo1234", 12);

  // Unsplash — araç görselleri
  const CAR_PHOTOS = [
    "photo-1503376780353-7e6692767b70",
    "photo-1494976388531-d1058494cdd8",
    "photo-1552519507-da3b142c6e3d",
    "photo-1583121274602-3e2820c69888",
    "photo-1550355291-bbee04a92027",
    "photo-1568605117036-5fe5e7bab0b7",
    "photo-1541899481282-d53bffe3c35d",
    "photo-1502877338535-766e1452684a",
  ].map((id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Akdeniz Otomotiv",
      slug: SLUG_GALERI,
      vertical: "AUTO_DEALER",
      city: "Antalya",
      district: "Muratpaşa",
      phone: "+90 242 000 00 00",
      whatsapp: "+90 532 000 10 01",
      plan: "pro",
      showcaseTagline:
        "Her araç ekspertizden geçer, hasar kaydı ve kilometresi olduğu gibi paylaşılır. Antalya'nın güvenilir galerisi.",
      aboutTitle: "Ekspertizli araç, şeffaf fiyat.",
      aboutText:
        "Galeriye giren her araç bağımsız ekspertizden geçer; boya, değişen ve kilometre bilgisi olduğu gibi ilana yazılır. Takas ve kredi desteğiyle anahtar teslim satış yaparız.",
      visionText:
        "İkinci el araçta güven, gizlenen değil paylaşılan bilgidir.",
      aboutStats: [
        { value: "9", label: "Yıl" },
        { value: "1.400+", label: "Satılan araç" },
        { value: "%94", label: "Memnuniyet" },
      ],
    },
  });
  const t = tenant.id;

  const owner = await prisma.user.create({
    data: {
      tenantId: t,
      name: "Kaan Akdeniz",
      email: "sahibi@akdenizotomotiv.com",
      passwordHash,
      role: "OWNER",
      phone: "+90 532 000 10 01",
    },
  });

  const contactData: Array<{
    fullName: string;
    type: "BUYER" | "SELLER" | "TENANT_C" | "LANDLORD";
    phone: string;
  }> = [
    { fullName: "Cem Yıldırım", type: "BUYER", phone: "+90 555 210 10 10" },
    { fullName: "Derya Aksoy", type: "BUYER", phone: "+90 555 210 20 20" },
    { fullName: "Onur Taş", type: "TENANT_C", phone: "+90 555 210 30 30" },
    { fullName: "Sibel Er", type: "SELLER", phone: "+90 555 210 40 40" },
  ];
  const contacts = await Promise.all(
    contactData.map((c) => prisma.contact.create({ data: { tenantId: t, ...c } }))
  );

  // ── Araç ilanları ──
  type V = {
    title: string;
    purpose: "SALE" | "RENT";
    type: "SEDAN" | "HATCHBACK" | "SUV" | "PICKUP" | "MINIVAN" | "COMMERCIAL_VEHICLE" | "MOTORCYCLE";
    price: number;
    brand: string;
    model: string;
    year: number;
    km: number;
    fuel: string;
    transmission: string;
    color: string;
    status?: "ACTIVE" | "SOLD" | "RENTED";
  };
  const V: V[] = [
    { title: "2019 VW Passat 1.6 TDI Elegance", purpose: "SALE", type: "SEDAN", price: 1_450_000, brand: "Volkswagen", model: "Passat 1.6 TDI", year: 2019, km: 98000, fuel: "Dizel", transmission: "Otomatik", color: "Beyaz" },
    { title: "2021 Renault Clio 1.0 TCe Touch", purpose: "SALE", type: "HATCHBACK", price: 890_000, brand: "Renault", model: "Clio 1.0 TCe", year: 2021, km: 42000, fuel: "Benzin", transmission: "Manuel", color: "Gri" },
    { title: "2020 BMW 320i Sport Line", purpose: "SALE", type: "SEDAN", price: 2_350_000, brand: "BMW", model: "320i", year: 2020, km: 61000, fuel: "Benzin", transmission: "Otomatik", color: "Siyah" },
    { title: "2018 Ford Ranger XLT 4x4", purpose: "SALE", type: "PICKUP", price: 1_680_000, brand: "Ford", model: "Ranger XLT", year: 2018, km: 132000, fuel: "Dizel", transmission: "Manuel", color: "Mavi" },
    { title: "2022 Toyota Corolla 1.8 Hybrid Dream", purpose: "SALE", type: "SEDAN", price: 1_620_000, brand: "Toyota", model: "Corolla 1.8 Hybrid", year: 2022, km: 28000, fuel: "Hibrit", transmission: "Otomatik", color: "Gümüş" },
    { title: "2023 Tesla Model 3 Long Range", purpose: "SALE", type: "SEDAN", price: 2_950_000, brand: "Tesla", model: "Model 3 LR", year: 2023, km: 15000, fuel: "Elektrik", transmission: "Otomatik", color: "Kırmızı" },
    { title: "2017 Nissan Qashqai 1.5 dCi Sky Pack", purpose: "SALE", type: "SUV", price: 1_120_000, brand: "Nissan", model: "Qashqai 1.5 dCi", year: 2017, km: 145000, fuel: "Dizel", transmission: "Manuel", color: "Kahverengi" },
    { title: "2021 Fiat Egea 1.4 Fire Urban (Günlük Kiralık)", purpose: "RENT", type: "SEDAN", price: 1_400, brand: "Fiat", model: "Egea 1.4 Fire", year: 2021, km: 76000, fuel: "Benzin", transmission: "Manuel", color: "Beyaz" },
  ];

  const listings = [];
  for (let i = 0; i < V.length; i++) {
    const x = V[i];
    const listing = await prisma.listing.create({
      data: {
        tenantId: t,
        agentId: owner.id,
        refCode: `GF-2026-${String(i + 1).padStart(4, "0")}`,
        title: x.title,
        purpose: x.purpose,
        type: x.type,
        status: x.status ?? "ACTIVE",
        price: P(x.price),
        city: "Antalya",
        district: "Muratpaşa",
        neighborhood: "Fener",
        vehicleBrand: x.brand,
        vehicleModel: x.model,
        vehicleYear: x.year,
        vehicleKm: x.km,
        fuel: x.fuel,
        transmission: x.transmission,
        color: x.color,
        bodyType: x.type,
        creditEligible: x.purpose === "SALE",
        description:
          "Ekspertiz raporu galeride mevcuttur. Takas ve kredi desteği sağlanır. Detay ve test sürüşü için bize ulaşın.",
        media: {
          create: [
            { url: CAR_PHOTOS[i % CAR_PHOTOS.length], key: `demo/car-${i}-0.jpg`, order: 0 },
            { url: CAR_PHOTOS[(i + 1) % CAR_PHOTOS.length], key: `demo/car-${i}-1.jpg`, order: 1 },
            { url: CAR_PHOTOS[(i + 3) % CAR_PHOTOS.length], key: `demo/car-${i}-2.jpg`, order: 2 },
          ],
        },
      },
    });
    listings.push(listing);
  }

  // ── Araç kriterli lead'ler ──
  const leadData = [
    { contactIdx: 0, purpose: "SALE" as const, vehicleBrand: "Volkswagen", minYear: 2018, maxKm: 120000, fuel: "Dizel", transmission: "Otomatik", maxPrice: 1_600_000, source: "vitrin" },
    { contactIdx: 1, purpose: "SALE" as const, vehicleBrand: "Toyota", vehicleModel: "Corolla", minYear: 2021, fuel: "Hibrit", maxPrice: 1_800_000, source: "instagram" },
    { contactIdx: 2, purpose: "RENT" as const, maxPrice: 2_000, source: "vitrin" },
  ];
  const leads = [];
  for (const ld of leadData) {
    const lead = await prisma.lead.create({
      data: {
        tenantId: t,
        contactId: contacts[ld.contactIdx].id,
        status: "OPEN",
        source: ld.source,
        purpose: ld.purpose,
        vehicleBrand: ld.vehicleBrand ?? null,
        vehicleModel: ld.vehicleModel ?? null,
        minYear: ld.minYear ?? null,
        maxKm: ld.maxKm ?? null,
        fuel: ld.fuel ?? null,
        transmission: ld.transmission ?? null,
        maxPrice: ld.maxPrice ? P(ld.maxPrice) : null,
        note: "[Demo] Araç arama talebi.",
      },
    });
    leads.push(lead);
  }

  // ── Kira sözleşmesi (günlük kiralık Egea) + ödeme planı → dashboard kira widget'ı ──
  const rentalListing = listings.find((l) => l.purpose === "RENT")!;
  const start = new Date();
  start.setDate(start.getDate() - 20); // 20 gün önce başladı
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30); // 30 günlük kiralama
  const dailyRent = 1_400;
  const agreement = await prisma.rentalAgreement.create({
    data: {
      tenantId: t,
      listingId: rentalListing.id,
      contactId: contacts[2].id,
      title: "Fiat Egea — 30 günlük kiralama",
      status: "ACTIVE",
      period: "DAILY",
      startDate: start,
      endDate: end,
      rentAmount: P(dailyRent),
      paymentDueDay: 1,
      note: "[Demo] Günlük araç kiralama sözleşmesi.",
    },
  });

  // Günlük ödeme satırları — geçmiştekiler ödenmiş, bugünden sonrası bekliyor
  const now = new Date();
  const paymentRows: Array<{ periodLabel: string; dueDate: Date; paid: boolean }> = [];
  const cur = new Date(start);
  let day = 0;
  while (cur <= end) {
    paymentRows.push({
      periodLabel: `G${++day}-${cur.toISOString().slice(0, 10)}`,
      dueDate: new Date(cur),
      paid: cur < now,
    });
    cur.setDate(cur.getDate() + 1);
  }
  await prisma.rentPayment.createMany({
    data: paymentRows.map((p) => ({
      tenantId: t,
      agreementId: agreement.id,
      periodLabel: p.periodLabel,
      dueDate: p.dueDate,
      amount: P(dailyRent),
      paidAt: p.paid ? p.dueDate : null,
      method: p.paid ? "nakit" : null,
    })),
  });

  console.log("\n✔ Akdeniz Otomotiv (GaleriFlow) oluşturuldu");
  console.log(`  Ofis: ${tenant.name} (${SLUG_GALERI})`);
  console.log(`  Araçlar: ${listings.length} · Lead: ${leads.length} · Kira: 1 (${paymentRows.length} ödeme)`);
  console.log(`  🔑 Giriş: sahibi@akdenizotomotiv.com / demo1234`);
  console.log(`  🌐 Vitrin: /ofis/${SLUG_GALERI}\n`);
}

// ═══════════════════════════════════════════════════════════════════
// PRESTİJ GAYRİMENKUL — AI Stüdyo vitrin ofisi
// Her ilan bir video şablonunun referans çekimi için kuruldu; fotoğraflar
// R2'de demo/studio/<set>/<n>.jpg olarak GERÇEKTEN durur (reference modu
// Fal'a presignDownload(key) verir — sahte key üretimi kırar).
// ═══════════════════════════════════════════════════════════════════

async function seedPrestij() {
  const passwordHash = await hash("demo1234", 12);

  const unsplash = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

  const tenant = await prisma.tenant.create({
    data: {
      name: "Prestij Gayrimenkul",
      slug: SLUG_PRESTIJ,
      city: "İstanbul",
      district: "Sarıyer",
      phone: "+90 212 000 00 00",
      whatsapp: "+90 532 000 20 01",
      plan: "premium",
      aiImageCredits: 500,
      aiVideoCredits: 100,
      showcaseEnabled: true,
      showcaseTagline:
        "İstanbul'un prestij bölgelerinde seçkin portföy — her ilan sinematik tanıtım videosuyla yayınlanır.",
      aboutTitle: "Her mülk, kendi filmini hak eder.",
      aboutText:
        "Zekeriyaköy'den Nişantaşı'na, portföyümüzdeki her mülkü profesyonel görsellerle ve yapay zeka destekli tanıtım videolarıyla pazarlıyoruz. Doğru alıcıya, doğru hikâyeyle ulaşırız.",
      visionText: "Gayrimenkul pazarlamasında yeni standart: video önce gelir.",
      aboutStats: [
        { value: "18", label: "Yıl" },
        { value: "%40", label: "Daha hızlı satış" },
        { value: "500+", label: "Video tanıtım" },
      ],
    },
  });
  const t = tenant.id;

  const owner = await prisma.user.create({
    data: {
      tenantId: t,
      name: "Selim Prestij",
      email: "sahibi@prestijgayrimenkul.com",
      passwordHash,
      role: "OWNER",
      phone: "+90 532 000 20 01",
    },
  });

  // Şablon eşlemesi → fotoğraf seti (R2 demo/studio/<set>/)
  type PL = {
    set: string; // R2 klasörü + şablon hedefi (yorumda)
    photos: string[]; // unsplash foto id'leri — sırası R2 key sırasıyla aynı
    title: string;
    purpose: "SALE" | "RENT";
    type: "APARTMENT" | "VILLA" | "LAND" | "HOUSE";
    price: number;
    district: string;
    neighborhood: string;
    rooms?: string;
    gross?: number;
    net?: number;
    floor?: number;
    age?: number;
    lat: number;
    lng: number;
    description: string;
  };
  const P_LISTINGS: PL[] = [
    {
      // → luxury_showcase
      set: "villa-zekeriyakoy",
      photos: ["1613490493576-7fde63acd811", "1613977257363-707ba9348227", "1613977257592-4871e5fcd7c4", "1600596542815-ffad4c1539a9", "1580587771525-78b9dba3b914", "1582268611958-ebfd161ef9cf", "1512917774080-9991f1c4c750"],
      title: "Zekeriyaköy'de Havuzlu Modern Villa",
      purpose: "SALE", type: "VILLA", price: 85_000_000,
      district: "Sarıyer", neighborhood: "Zekeriyaköy",
      rooms: "6+2", gross: 520, net: 450, age: 2, lat: 41.2033, lng: 29.0211,
      description: "Özel peyzajlı bahçe içinde, sonsuzluk havuzlu, akıllı ev donanımlı modern villa. Çift kat yüksekliğinde salon, şömine, kapalı otopark ve güvenlikli site avantajı.",
    },
    {
      // → fpv_tour
      set: "daire-maslak",
      photos: ["1600607687939-ce8a6c25118c", "1600607687920-4e2a09cf159d", "1600607687644-c7171b42498f", "1600585152220-90363fe7e115", "1600566752355-35792bedcfea", "1600566753086-00f18fb6b3ea", "1595526114035-0d45ed16cfbf"],
      title: "Maslak'ta Boğaz Manzaralı Modern 3+1",
      purpose: "SALE", type: "APARTMENT", price: 21_500_000,
      district: "Sarıyer", neighborhood: "Maslak",
      rooms: "3+1", gross: 165, net: 140, floor: 14, age: 1, lat: 41.1113, lng: 29.0208,
      description: "A+ kulede, tavandan tabana cam cepheli, İtalyan mutfaklı sıfır daire. Rezidans hizmetleri, vale ve fitness dahil.",
    },
    {
      // → cinematic_fpv
      set: "penthouse-nisantasi",
      photos: ["1618221195710-dd6b41faaea6", "1600210492486-724fe5c67fb0", "1600210491892-03d54c0aaf87", "1617806118233-18e1de247200", "1616486338812-3dadae4b4ace", "1583847268964-b28dc8f51f92", "1554995207-c18c203602cb"],
      title: "Nişantaşı'nda Teraslı Dubleks Penthouse",
      purpose: "SALE", type: "APARTMENT", price: 52_000_000,
      district: "Şişli", neighborhood: "Teşvikiye",
      rooms: "4+1", gross: 240, net: 205, floor: 9, age: 5, lat: 41.0482, lng: 28.9936,
      description: "Şehir manzaralı 80 m² çatı terası, özel asansör holü ve tasarım mobilyalarla teslim. Nişantaşı'nın kalbinde eşsiz bir yaşam.",
    },
    {
      // → classic_interior
      set: "aile-evi-gokturk",
      photos: ["1560184897-ae75f418493e", "1560185007-cde436f6a4d0", "1560448204-e02f11c3d0e2", "1565182999561-18d7dc61c393", "1556912167-f556f1f39fdf", "1598928506311-c55ded91a20c", "1509644851169-2acc08aa25b5"],
      title: "Göktürk'te Bahçeli Geniş Aile Evi",
      purpose: "SALE", type: "HOUSE", price: 45_000_000,
      district: "Eyüpsultan", neighborhood: "Göktürk",
      rooms: "5+1", gross: 380, net: 320, age: 7, lat: 41.1571, lng: 28.8952,
      description: "Site içinde müstakil bahçeli, ferah oda düzenli aile evi. Ebeveyn katı, geniş amerikan mutfak ve verandasıyla şehirden kopmadan sakin yaşam.",
    },
    {
      // → golden_hour
      set: "villa-beykoz",
      photos: ["1600585154340-be6161a56a0c", "1600585154526-990dced4db0d", "1600047509807-ba8f99d2cdde", "1494526585095-c41746248156", "1568605114967-8130f3a36994"],
      title: "Beykoz'da Mimari Tasarım Villa",
      purpose: "SALE", type: "VILLA", price: 38_000_000,
      district: "Beykoz", neighborhood: "Acarlar",
      rooms: "4+1", gross: 290, net: 250, age: 3, lat: 41.1302, lng: 29.1021,
      description: "Ödüllü mimari çizgileriyle koru manzaralı tasarım villa. Gün batımında siyah cephesi ve sıcak ahşap dokusuyla fotoğraf gibi bir ev.",
    },
    {
      // → land_drone
      set: "arsa-catalca",
      photos: ["1500382017468-9049fed747ef", "1500534314209-a25ddb2bd429", "1472214103451-9374bd1c798e", "1470071459604-3b5ec3a7fe05", "1441974231531-c6227db76b6e"],
      title: "Çatalca'da Yatırımlık İmarlı Arsa",
      purpose: "SALE", type: "LAND", price: 12_000_000,
      district: "Çatalca", neighborhood: "Kabakça",
      gross: 2400, net: 2400, lat: 41.2431, lng: 28.4212,
      description: "Yola cepheli, %20 imarlı, elektrik ve suyu sınırında yatırımlık arsa. Kanal İstanbul aksına 15 dk mesafede değer artış potansiyeli.",
    },
    {
      // → fpv_reels (9:16)
      set: "daire-cihangir",
      photos: ["1615873968403-89e068629265", "1586023492125-27b2c045efd7", "1522708323590-d24dbb6b0267", "1502672260266-1c1ef2d93688", "1493809842364-78817add7ffb", "1567767292278-a4f21aa2d36e"],
      title: "Cihangir'de Tasarım 2+1",
      purpose: "SALE", type: "APARTMENT", price: 14_500_000,
      district: "Beyoğlu", neighborhood: "Cihangir",
      rooms: "2+1", gross: 110, net: 95, floor: 3, age: 30, lat: 41.0312, lng: 28.9821,
      description: "Cihangir'in ruhunu taşıyan, renkli ve karakterli tasarım daire. Yüksek tavan, özgün detaylar, kafelere ve Boğaz'a yürüme mesafesi.",
    },
    {
      // → social_promo (9:16)
      set: "rezidans-kagithane",
      photos: ["1515263487990-61b07816b324", "1505873242700-f289a29e1e0f", "1484154218962-a197022b5858", "1481277542470-605612bd2d61"],
      title: "Kağıthane'de Rezidans 1+1",
      purpose: "SALE", type: "APARTMENT", price: 8_900_000,
      district: "Kağıthane", neighborhood: "Merkez",
      rooms: "1+1", gross: 75, net: 58, floor: 12, age: 1, lat: 41.0853, lng: 28.9702,
      description: "Loft konseptli, yüksek kira getirili yatırımlık rezidans dairesi. Metro bağlantısı kapıda, iş kulelerine 5 dakika.",
    },
  ];

  let photoTotal = 0;
  for (let i = 0; i < P_LISTINGS.length; i++) {
    const x = P_LISTINGS[i];
    await prisma.listing.create({
      data: {
        tenantId: t,
        agentId: owner.id,
        refCode: `PG-2026-${String(i + 1).padStart(4, "0")}`,
        title: x.title,
        purpose: x.purpose,
        type: x.type,
        status: "ACTIVE",
        price: P(x.price),
        city: "İstanbul",
        district: x.district,
        neighborhood: x.neighborhood,
        lat: x.lat,
        lng: x.lng,
        rooms: x.rooms,
        grossArea: x.gross,
        netArea: x.net,
        floor: x.floor,
        buildingAge: x.age,
        heating: x.type === "LAND" ? null : "Yerden Isıtma",
        deedStatus: x.type === "LAND" ? "Arsa" : "Kat Mülkiyeti",
        creditEligible: true,
        description: x.description,
        media: {
          create: x.photos.map((id, order) => ({
            url: unsplash(id),
            key: `demo/studio/${x.set}/${order}.jpg`,
            order,
          })),
        },
      },
    });
    photoTotal += x.photos.length;
  }

  console.log("\n✔ Prestij Gayrimenkul (AI Stüdyo vitrini) oluşturuldu");
  console.log(`  İlan: ${P_LISTINGS.length} (şablon başına bir referans ilanı) · Foto: ${photoTotal} (R2'de gerçek)`);
  console.log(`  Kredi: 100 video / 500 foto · Plan: premium`);
  console.log(`  🔑 Giriş: sahibi@prestijgayrimenkul.com / demo1234`);
  console.log(`  🌐 Vitrin: /ofis/${SLUG_PRESTIJ}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
