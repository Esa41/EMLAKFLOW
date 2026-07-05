/**
 * EmlakFlow · Demo Seed
 * Çalıştır: npx prisma db seed   (package.json → prisma.seed)
 * Tekrar çalıştırılabilir: "atlas-gayrimenkul" slug'lı demo ofisi silip yeniden kurar.
 *
 * Demo girişleri (şifre hepsi: demo1234)
 *   sahibi@atlasgayrimenkul.com   → OWNER  (Emre Atlas)
 *   zeynep@atlasgayrimenkul.com   → AGENT  (Zeynep Kaya)
 *   murat@atlasgayrimenkul.com    → AGENT  (Murat Demir)
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SLUG = "atlas-gayrimenkul";
// Prisma, Decimal alanlara number kabul eder — P sadece okunabilirlik için
const P = (n: number) => n;

// Unsplash — konut iç/dış mekân görselleri
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
].map((id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`);

function todayAt(h: number, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
function daysFromNow(n: number, h = 10) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, 0, 0, 0);
  return d;
}

async function main() {
  // Önceki demo'yu temizle (cascade tüm alt kayıtları siler)
  await prisma.tenant.deleteMany({ where: { slug: SLUG } });

  const passwordHash = await hash("demo1234", 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Atlas Gayrimenkul",
      slug: SLUG,
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

  console.log("✔ Seed tamam:");
  console.log(`  Ofis: ${tenant.name} (${SLUG})`);
  console.log(`  Kullanıcı: 3 · İlan: ${listings.length} · Lead: ${leads.length} · Deal: ${dealSeed.length}`);
  console.log("  Giriş: sahibi@atlasgayrimenkul.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
