import type { ContractType, ListingPurpose } from "@prisma/client";
import { CONTRACT_TYPE_TR } from "./labels";

/**
 * Otomatik sözleşme taslağı üretimi — AI gerektirmez, Tenant + Contact + Listing
 * verisinden deterministik HTML üretir. `/api/contracts/draft` bu HTML'i
 * doğrudan tarayıcıya döner; kullanıcı Ctrl/Cmd+P ile PDF'e çevirip yazdırır.
 */

export interface ContractData {
  type: ContractType;
  tenant: {
    name: string;
    contractCompanyTitle: string | null;
    contractRepresentative: string | null;
    contractAddress: string | null;
    contractTaxNo: string | null;
    contractExtraClauses: string | null;
    phone: string | null;
  };
  contact: {
    fullName: string;
    phone: string | null;
    email: string | null;
  } | null;
  listing: {
    refCode: string;
    title: string;
    city: string;
    district: string;
    neighborhood: string | null;
    address: string | null;
    price: number;
    purpose: ListingPurpose;
    rooms: string | null;
    netArea: number | null;
    grossArea: number | null;
  } | null;
  dealValue: number | null;
}

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listingAddress(l: ContractData["listing"]): string {
  if (!l) return "—";
  return [l.address, l.neighborhood, l.district, l.city]
    .filter(Boolean)
    .map(esc)
    .join(", ");
}

function listingSpecs(l: ContractData["listing"]): string {
  if (!l) return "—";
  const parts = [
    l.rooms,
    l.netArea ? `net ${l.netArea} m²` : null,
    l.grossArea ? `brüt ${l.grossArea} m²` : null,
  ];
  return parts.filter(Boolean).join(" · ") || "—";
}

function baseStyle(): string {
  return `
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #111;
      line-height: 1.55;
      max-width: 780px;
      margin: 0 auto;
      padding: 40px 24px;
      font-size: 14px;
    }
    h1 { font-size: 19px; text-align: center; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 26px; margin-bottom: 8px; border-bottom: 1px solid #111; padding-bottom: 3px; }
    p { margin: 6px 0; }
    .subtitle { text-align: center; font-size: 11px; color: #555; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.1em; }
    .meta { display: flex; justify-content: space-between; font-size: 12px; color: #333; margin-bottom: 18px; }
    table.parties { width: 100%; border-collapse: collapse; margin: 10px 0 4px; }
    table.parties td { vertical-align: top; padding: 8px 10px; border: 1px solid #bbb; width: 50%; font-size: 13px; }
    table.parties td b { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #555; margin-bottom: 4px; }
    ol.clauses { padding-left: 20px; }
    ol.clauses li { margin-bottom: 10px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .signatures div { width: 45%; text-align: center; }
    .signatures .line { border-top: 1px solid #111; margin-top: 50px; padding-top: 6px; font-size: 12px; }
    .footer-note { margin-top: 30px; font-size: 10px; color: #777; text-align: center; }
    @media print {
      @page { size: A4; margin: 2cm; }
      body { padding: 0; max-width: none; }
    }
  `;
}

function shell(title: string, subtitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<style>${baseStyle()}</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="subtitle">${esc(subtitle)}</p>
  ${body}
</body>
</html>`;
}

function officeBlock(t: ContractData["tenant"]): string {
  const officeTitle = t.contractCompanyTitle ?? t.name;
  return `
    <b>Emlakçı / Yetkili</b>
    ${esc(officeTitle)}<br/>
    ${t.contractRepresentative ? `Yetkili temsilci: ${esc(t.contractRepresentative)}<br/>` : ""}
    ${t.contractAddress ? `Adres: ${esc(t.contractAddress)}<br/>` : ""}
    ${t.contractTaxNo ? `Vergi No: ${esc(t.contractTaxNo)}<br/>` : ""}
    ${t.phone ? `Telefon: ${esc(t.phone)}` : ""}
  `;
}

function customerBlock(c: ContractData["contact"]): string {
  if (!c) return `<b>Müşteri</b> Bilgi girilmedi.`;
  return `
    <b>Müşteri</b>
    ${esc(c.fullName)}<br/>
    ${c.phone ? `Telefon: ${esc(c.phone)}<br/>` : ""}
    ${c.email ? `E-posta: ${esc(c.email)}` : ""}
  `;
}

function partiesTable(
  t: ContractData["tenant"],
  c: ContractData["contact"],
): string {
  return `
    <table class="parties">
      <tr>
        <td>${officeBlock(t)}</td>
        <td>${customerBlock(c)}</td>
      </tr>
    </table>
  `;
}

function metaLine(): string {
  const today = new Date().toLocaleDateString("tr-TR");
  return `<div class="meta"><span>Sözleşme Tarihi: ${today}</span></div>`;
}

function extraClauses(t: ContractData["tenant"]): string {
  if (!t.contractExtraClauses) return "";
  return `
    <h2>Ek Maddeler</h2>
    <p>${esc(t.contractExtraClauses).replace(/\n/g, "<br/>")}</p>
  `;
}

function signatures(): string {
  return `
    <div class="signatures">
      <div><div class="line">Emlakçı / Yetkili İmza</div></div>
      <div><div class="line">Müşteri İmza</div></div>
    </div>
  `;
}

function footerNote(): string {
  return `<p class="footer-note">Otomatik oluşturulan taslak sözleşmedir — imzalanmadan önce tarafların kontrolüne tabidir.</p>`;
}

function authorizationDoc(d: ContractData): string {
  const l = d.listing;
  const body = `
    ${metaLine()}
    ${partiesTable(d.tenant, d.contact)}
    <h2>Madde 1 — Konu</h2>
    <p>
      İşbu Yetki Belgesi ile Müşteri, aşağıda nitelikleri belirtilen taşınmazın
      ${l?.purpose === "RENT" ? "kiraya verilmesi" : "satışa sunulması"} işlemlerini
      yürütmek üzere Emlakçı'yı yetkilendirmiştir.
    </p>
    <h2>Madde 2 — Taşınmaz Bilgileri</h2>
    <p>
      Künye: <b>${esc(l?.refCode ?? "—")}</b><br/>
      Adres: ${listingAddress(l)}<br/>
      Nitelik: ${listingSpecs(l)}<br/>
      ${l?.price ? `Talep edilen bedel: ${tl.format(l.price)}${l.purpose === "RENT" ? " / ay" : ""}` : ""}
    </p>
    <h2>Madde 3 — Yetkinin Kapsamı ve Süresi</h2>
    <ol class="clauses">
      <li>Emlakçı, taşınmazı portföyüne alarak ilan, tanıtım ve pazarlama faaliyetlerini yürütür.</li>
      <li>Bu yetki belgesi, düzenlendiği tarihten itibaren <b>90 (doksan) gün</b> süreyle geçerlidir; taraflar mutabık kalırsa yenilenebilir.</li>
      <li>Müşteri, süre içinde taşınmazı başka bir emlakçı aracılığıyla veya doğrudan satarsa/kiraya verirse, Emlakçı'yı en geç 3 iş günü içinde bilgilendirmekle yükümlüdür.</li>
    </ol>
    <h2>Madde 4 — Ücret ve Komisyon</h2>
    <p>
      İşlemin gerçekleşmesi halinde uygulanacak komisyon oranı, yürürlükteki mevzuat
      ve ofis komisyon politikası çerçevesinde ayrıca mutabık kalınan tutar/orandır.
    </p>
    <h2>Madde 5 — Uyuşmazlıkların Çözümü</h2>
    <p>İşbu belgeden doğacak uyuşmazlıklarda taşınmazın bulunduğu yer mahkeme ve icra daireleri yetkilidir.</p>
    ${extraClauses(d.tenant)}
    ${signatures()}
    ${footerNote()}
  `;
  return shell(
    "Yetki Belgesi",
    "Emlak Pazarlama ve Satış/Kiralama Yetki Belgesi",
    body,
  );
}

function viewingFormDoc(d: ContractData): string {
  const l = d.listing;
  const body = `
    ${metaLine()}
    ${partiesTable(d.tenant, d.contact)}
    <h2>Madde 1 — Konu</h2>
    <p>
      Emlakçı, aşağıda bilgileri yer alan taşınmazı Müşteri'ye yerinde göstermiş
      olup, işbu form bu görüşmenin kaydını oluşturur.
    </p>
    <h2>Madde 2 — Taşınmaz Bilgileri</h2>
    <p>
      Künye: <b>${esc(l?.refCode ?? "—")}</b><br/>
      Adres: ${listingAddress(l)}<br/>
      Nitelik: ${listingSpecs(l)}
    </p>
    <h2>Madde 3 — Beyan</h2>
    <ol class="clauses">
      <li>Müşteri, taşınmazı Emlakçı aracılığıyla gördüğünü ve tanıdığını kabul eder.</li>
      <li>Müşteri, bu taşınmaz için ileride Emlakçı dışında bir aracı veya doğrudan mal sahibiyle işlem yapması halinde dahi, Emlakçı'nın bu görüşmeye dayalı komisyon hakkının saklı olduğunu kabul eder.</li>
      <li>Bu form, tarafların karşılıklı imzasıyla yürürlüğe girer.</li>
    </ol>
    ${extraClauses(d.tenant)}
    ${signatures()}
    ${footerNote()}
  `;
  return shell(
    "Yer Gösterme Formu",
    "Taşınmaz Yerinde Gösterim Tutanağı",
    body,
  );
}

function saleContractDoc(d: ContractData): string {
  const l = d.listing;
  const price = d.dealValue ?? l?.price ?? 0;
  const body = `
    ${metaLine()}
    ${partiesTable(d.tenant, d.contact)}
    <h2>Madde 1 — Konu</h2>
    <p>
      İşbu sözleşme, aşağıda nitelikleri belirtilen taşınmazın satışına ilişkin
      tarafların hak ve yükümlülüklerini düzenler.
    </p>
    <h2>Madde 2 — Taşınmaz Bilgileri</h2>
    <p>
      Künye: <b>${esc(l?.refCode ?? "—")}</b><br/>
      Adres: ${listingAddress(l)}<br/>
      Nitelik: ${listingSpecs(l)}
    </p>
    <h2>Madde 3 — Satış Bedeli</h2>
    <p>
      Taraflar, taşınmazın satış bedelini <b>${tl.format(price)}</b> olarak
      kararlaştırmışlardır. Ödeme şekli ve takvimi tarafların ayrıca mutabık
      kalacağı şekilde belirlenir.
    </p>
    <h2>Madde 4 — Tapu Devri</h2>
    <ol class="clauses">
      <li>Tapu devri, bedelin tamamının ödenmesini takiben ilgili Tapu Müdürlüğü'nde gerçekleştirilir.</li>
      <li>Tapu devir masrafları ve harçlar, ilgili mevzuat çerçevesinde taraflarca karşılanır.</li>
      <li>Taşınmazın teslimi, aksi kararlaştırılmadıkça tapu devri ile eş zamanlı yapılır.</li>
    </ol>
    <h2>Madde 5 — Beyan ve Taahhütler</h2>
    <p>
      Satıcı, taşınmazın üzerinde satışa engel haciz, ipotek veya takyidat bulunmadığını
      beyan eder. Emlakçı, işlemin usulüne uygun yürütülmesinde taraflara aracılık eder.
    </p>
    <h2>Madde 6 — Uyuşmazlıkların Çözümü</h2>
    <p>İşbu sözleşmeden doğacak uyuşmazlıklarda taşınmazın bulunduğu yer mahkeme ve icra daireleri yetkilidir.</p>
    ${extraClauses(d.tenant)}
    ${signatures()}
    ${footerNote()}
  `;
  return shell(
    "Satış Sözleşmesi",
    "Gayrimenkul Satış Vaadi ve Satış Sözleşmesi",
    body,
  );
}

function rentContractDoc(d: ContractData): string {
  const l = d.listing;
  const price = d.dealValue ?? l?.price ?? 0;
  const body = `
    ${metaLine()}
    ${partiesTable(d.tenant, d.contact)}
    <h2>Madde 1 — Konu</h2>
    <p>
      İşbu sözleşme, aşağıda nitelikleri belirtilen taşınmazın kiraya verilmesine
      ilişkin tarafların hak ve yükümlülüklerini düzenler.
    </p>
    <h2>Madde 2 — Taşınmaz Bilgileri</h2>
    <p>
      Künye: <b>${esc(l?.refCode ?? "—")}</b><br/>
      Adres: ${listingAddress(l)}<br/>
      Nitelik: ${listingSpecs(l)}
    </p>
    <h2>Madde 3 — Kira Bedeli ve Ödeme</h2>
    <p>
      Aylık kira bedeli <b>${tl.format(price)}</b> olarak kararlaştırılmıştır.
      Kira bedeli, aksi kararlaştırılmadıkça her ayın ilk 5 (beş) günü içinde
      kiraya verenin bildireceği hesaba ödenir.
    </p>
    <h2>Madde 4 — Süre</h2>
    <ol class="clauses">
      <li>Kira sözleşmesi 1 (bir) yıl süreyle düzenlenmiş olup, taraflarca fesih bildirilmediği takdirde aynı şartlarla yenilenmiş sayılır.</li>
      <li>Depozito bedeli, taraflarca ayrıca mutabık kalınan tutar üzerinden kira başlangıcında alınır.</li>
    </ol>
    <h2>Madde 5 — Tarafların Yükümlülükleri</h2>
    <p>
      Kiracı, taşınmazı sözleşme süresince özenle kullanmayı, kiraya veren ise
      taşınmazı kullanıma elverişli halde teslim etmeyi kabul eder.
    </p>
    <h2>Madde 6 — Uyuşmazlıkların Çözümü</h2>
    <p>İşbu sözleşmeden doğacak uyuşmazlıklarda taşınmazın bulunduğu yer mahkeme ve icra daireleri yetkilidir.</p>
    ${extraClauses(d.tenant)}
    ${signatures()}
    ${footerNote()}
  `;
  return shell("Kira Sözleşmesi", "Gayrimenkul Kira Sözleşmesi", body);
}

export function renderContractHtml(data: ContractData): string {
  switch (data.type) {
    case "AUTHORIZATION":
      return authorizationDoc(data);
    case "VIEWING_FORM":
      return viewingFormDoc(data);
    case "SALE_CONTRACT":
      return saleContractDoc(data);
    case "RENT_CONTRACT":
      return rentContractDoc(data);
    default:
      return shell(
        "Sözleşme",
        CONTRACT_TYPE_TR[data.type] ?? "",
        "<p>Bilinmeyen sözleşme türü.</p>",
      );
  }
}
