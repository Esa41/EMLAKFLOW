import { prisma } from "./prisma";
import { officeFrom, sendMail } from "./mailer";

/**
 * Müşteri/pazarlama e-postaları — hepsi ofis (tenant) adına gider ve
 * EmailLog'a yazılır (sohbet sayfasındaki E-postalar sekmesinde listelenir).
 * Görsel şablonlar docs/mail-templates/ ile eşleşir.
 *
 * Marka kuralı: adres her zaman noreply@emlakflow.app (Resend'de doğrulanan
 * domain), görünen ad ofisin adı; EmlakFlow'un kendi mailleri (ofis sahibine
 * hoş geldin) EmlakFlow markasıyla gider.
 */

export type MailBrand = {
  /** Görünen gönderen adı — vitrin maillerinde ofis adı */
  name: string;
  /** Yanıtlar bu adrese düşer (ör. ofis sahibinin e-postası) */
  replyTo?: string;
};

export type MailLogCtx = {
  tenantId: string;
  kind: string;
  contactId?: string;
  listingId?: string;
  refId?: string;
};

const EMLAKFLOW_WORDMARK =
  '<p style="font-size:18px;font-weight:800;margin:0 0 4px">Emlak<span style="color:#1e5b3e">Flow</span></p>';

function baseTemplate(
  brandName: string,
  title: string,
  content: string,
  ctaText?: string,
  ctaLink?: string,
) {
  const header =
    brandName === "EmlakFlow"
      ? EMLAKFLOW_WORDMARK
      : `<p style="font-size:18px;font-weight:800;margin:0 0 4px">${brandName}</p>`;
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#17201c">
    ${header}
    <h1 style="font-size:20px;margin:24px 0 8px">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#4a544f">
      ${content}
    </div>
    ${
      ctaText && ctaLink
        ? `
    <p style="margin:28px 0">
      <a href="${ctaLink}" style="background:#1e5b3e;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;display:inline-block">
        ${ctaText}
      </a>
    </p>`
        : ""
    }
    <p style="font-size:12px;line-height:1.6;color:#8a938e;margin-top:40px;border-top:1px solid #e1e8e4;padding-top:16px;">
      Saygılarımızla,<br><strong>${brandName}</strong>
      ${brandName === "EmlakFlow" ? "" : '<br><span style="font-size:11px">Bu e-posta EmlakFlow altyapısıyla gönderilmiştir.</span>'}
    </p>
  </div>`;
}

/** Gönder + EmailLog'a yaz — tüm pazarlama mailleri buradan geçer. */
async function dispatch(opts: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  brand: MailBrand;
  log: MailLogCtx;
}): Promise<{ sent: boolean }> {
  const { sent, error } = await sendMail({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    from: officeFrom(opts.brand.name),
    replyTo: opts.brand.replyTo,
  });

  await prisma.emailLog
    .create({
      data: {
        tenantId: opts.log.tenantId,
        to: opts.to,
        toName: opts.toName ?? null,
        kind: opts.log.kind,
        subject: opts.subject,
        preview: opts.text.slice(0, 240),
        status: sent ? "sent" : "failed",
        error: error ?? null,
        listingId: opts.log.listingId ?? null,
        contactId: opts.log.contactId ?? null,
        refId: opts.log.refId ?? null,
      },
    })
    .catch((err) => console.error("[marketing-mailer] log yazılamadı:", err));

  return { sent };
}

/** EmlakFlow → yeni kayıt olan OFİS SAHİBİNE hoş geldin. */
export async function sendOfficeWelcomeEmail(
  to: string,
  ownerName: string,
  officeName: string,
  tenantId: string,
) {
  const title = "EmlakFlow'a Hoş Geldiniz";
  const content = `
    <p>Sayın <strong>${ownerName}</strong>,</p>
    <p><strong>${officeName}</strong> için EmlakFlow hesabınız hazır. Portföyünüzü ekleyin, ekibinizi davet edin — vitrin siteniz ilan girdiğiniz an yayında olur.</p>
    <p>İlk adım önerimiz: 2-3 ilanınızı girip vitrin bağlantınızı müşterilerinizle paylaşın.</p>
  `;
  const text = `Sayın ${ownerName}, ${officeName} için EmlakFlow hesabınız hazır. Panel: https://emlakflow.app/dashboard`;
  return dispatch({
    to,
    toName: ownerName,
    subject: "EmlakFlow'a Hoş Geldiniz — Ofisiniz Hazır",
    html: baseTemplate("EmlakFlow", title, content, "Panele Git", "https://emlakflow.app/dashboard"),
    text,
    brand: { name: "EmlakFlow" },
    log: { tenantId, kind: "office-welcome" },
  });
}

/** OFİS → vitrinine üye olan alıcı/kiracıya hoş geldin (ofis markalı). */
export async function sendSiteWelcomeEmail(
  to: string,
  customerName: string,
  brand: MailBrand,
  showcaseUrl: string,
  log: MailLogCtx,
) {
  const title = `${brand.name} Ailesine Hoş Geldiniz`;
  const content = `
    <p>Sayın <strong>${customerName}</strong>,</p>
    <p>Gayrimenkul arayışınızda bizi tercih ettiğiniz için teşekkür ederiz. Üyeliğinizle favori ilanlarınızı kaydedebilir, her cihazdan erişebilirsiniz.</p>
    <p>Beklentilerinize uygun yeni bir mülk portföyümüze eklendiğinde sizi haberdar edeceğiz.</p>
  `;
  const text = `Sayın ${customerName}, ${brand.name} üyeliğiniz oluşturuldu. Güncel portföy: ${showcaseUrl}`;
  return dispatch({
    to,
    toName: customerName,
    subject: `${brand.name} — Üyeliğiniz Oluşturuldu`,
    html: baseTemplate(brand.name, title, content, "Portföyü İnceleyin", showcaseUrl),
    text,
    brand,
    log,
  });
}

/** OFİS → kriterlere uyan yeni portföy önerisi (kişi detayından manuel). */
export async function sendNewListingEmail(
  to: string,
  customerName: string,
  listingTitle: string,
  listingLink: string,
  brand: MailBrand,
  log: MailLogCtx,
) {
  const title = "Arayışınıza Uygun Yeni Bir Portföyümüz Var";
  const content = `
    <p>Sayın <strong>${customerName}</strong>,</p>
    <p>Kriterlerinize uygun, portföyümüze yeni eklenen <strong>${listingTitle}</strong> isimli gayrimenkulü dikkatinize sunmak isteriz.</p>
    <p>Detaylıca incelemek ve yer gösterimi randevusu oluşturmak için aşağıdaki bağlantıyı ziyaret edebilirsiniz.</p>
  `;
  const text = `Sayın ${customerName}, kriterlerinize uygun yeni portföyümüz: ${listingTitle}. Detaylar: ${listingLink}`;
  return dispatch({
    to,
    toName: customerName,
    subject: "Arayışınıza Uygun Yeni İlanımız Yayında",
    html: baseTemplate(brand.name, title, content, "İlan Detaylarını Görüntüle", listingLink),
    text,
    brand,
    log,
  });
}

/** OFİS → favorilediği ilanda fiyat düşüşü (otomatik). */
export async function sendPriceDropEmail(
  to: string,
  customerName: string,
  listingTitle: string,
  oldPrice: string,
  newPrice: string,
  listingLink: string,
  brand: MailBrand,
  log: MailLogCtx,
) {
  const title = "Favori İlanınızda Fiyat Güncellemesi";
  const content = `
    <p>Sayın <strong>${customerName}</strong>,</p>
    <p>Favorilerinize eklediğiniz <strong>${listingTitle}</strong> isimli mülkün fiyatında sizin lehinize bir güncelleme gerçekleşti.</p>
    <p>Önceki Fiyat: <s>${oldPrice}</s><br>
    <strong>Yeni Fiyat: <span style="color:#1e5b3e">${newPrice}</span></strong></p>
    <p>Bu fırsatı değerlendirmek isterseniz bize ulaşabilir veya ilan sayfasını tekrar ziyaret edebilirsiniz.</p>
  `;
  const text = `Sayın ${customerName}, favori ilanınız ${listingTitle} için yeni fiyat: ${newPrice} (önceki: ${oldPrice}). ${listingLink}`;
  return dispatch({
    to,
    toName: customerName,
    subject: "Favori İlanınızda Fiyat Düşüşü",
    html: baseTemplate(brand.name, title, content, "Fırsatı İncele", listingLink),
    text,
    brand,
    log,
  });
}

/** OFİS → yarınki randevu hatırlatması (cron, otomatik). */
export async function sendAppointmentReminderEmail(
  to: string,
  customerName: string,
  date: string,
  time: string,
  location: string,
  brand: MailBrand,
  log: MailLogCtx,
) {
  const title = "Randevu Hatırlatması";
  const content = `
    <p>Sayın <strong>${customerName}</strong>,</p>
    <p>Planladığımız görüşmemizin detaylarını bilgilerinize sunarız:</p>
    <p>
      <strong>Tarih:</strong> ${date}<br>
      <strong>Saat:</strong> ${time}<br>
      <strong>Konum:</strong> ${location}
    </p>
    <p>Değişiklik veya iptal talebiniz olması durumunda lütfen bizimle önceden iletişime geçiniz. Görüşmek dileğiyle.</p>
  `;
  const text = `Sayın ${customerName}, ${date} tarihinde saat ${time}'daki randevunuzu hatırlatırız. Konum: ${location}.`;
  return dispatch({
    to,
    toName: customerName,
    subject: `Hatırlatma: ${date} Tarihindeki Randevunuz`,
    html: baseTemplate(brand.name, title, content),
    text,
    brand,
    log,
  });
}

/** OFİS → uzun süredir sessiz müşteriye kendini hatırlatma (manuel/ileride cron). */
export async function sendReengagementEmail(
  to: string,
  customerName: string,
  brand: MailBrand,
  showcaseUrl: string,
  log: MailLogCtx,
) {
  const title = "Gayrimenkul Arayışınız Devam Ediyor mu?";
  const content = `
    <p>Sayın <strong>${customerName}</strong>,</p>
    <p>Geçtiğimiz dönemde gayrimenkul ihtiyaçlarınızla ilgili sizinle iletişimde bulunmuştuk. Güncel gelişmeler ve portföyümüze yeni eklenen seçenekler doğrultusunda arayışınızın devam edip etmediğini öğrenmek isteriz.</p>
    <p>Beklentilerinizde değişiklik olduysa kriterlerinizi güncelleyerek size en uygun alternatifleri sunmaya hazırız.</p>
  `;
  const text = `Sayın ${customerName}, gayrimenkul arayışınız devam ediyorsa güncel portföyümüzle yardımcı olmaya hazırız: ${showcaseUrl}`;
  return dispatch({
    to,
    toName: customerName,
    subject: `${brand.name}: Size Nasıl Yardımcı Olabiliriz?`,
    html: baseTemplate(brand.name, title, content, "Portföyü İnceleyin", showcaseUrl),
    text,
    brand,
    log,
  });
}

/** OFİS → serbest metin (sohbet sayfasındaki E-postalar sekmesinden). */
export async function sendCustomEmail(
  to: string,
  toName: string | undefined,
  subject: string,
  message: string,
  brand: MailBrand,
  log: MailLogCtx,
) {
  const content = message
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return dispatch({
    to,
    toName,
    subject,
    html: baseTemplate(brand.name, subject, content),
    text: message,
    brand,
    log,
  });
}