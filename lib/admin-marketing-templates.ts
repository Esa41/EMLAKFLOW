/**
 * Super-admin outbound pazarlama şablonları.
 * Yer tutucular: {{Firma_Adi}}, {{Yetkili_Ismi}}, {{Bolge}}
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://emlakflow.app";

export type AdminMarketingVars = {
  firmaAdi: string;
  yetkiliIsmi?: string | null;
  bolge?: string | null;
};

export type AdminMarketingTemplate = {
  key: string;
  label: string;
  description: string;
  /** Konu şablonu — yer tutucular desteklenir */
  subject: string;
  /** Düz metin gövde (gönderimde HTML'e sarılır) */
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export const ADMIN_MARKETING_TEMPLATES: AdminMarketingTemplate[] = [
  {
    key: "demo-invite",
    label: "Demo daveti",
    description: "İlk tanıtım / ücretsiz deneme",
    subject: "{{Firma_Adi}} için EmlakFlow — kısa bir tanıtım",
    body: `Sayın {{Yetkili_Ismi}},

{{Firma_Adi}} ekibinin portföyünü tek panelden yönetmesi, vitrin sitesini dakikalar içinde yayına alması ve talepleri ilanlarla eşleştirmesi için EmlakFlow'u hazırladık.

15 dakikalık bir demo ile ofisinize özel kurulumu birlikte bakabiliriz.`,
    ctaLabel: "Ücretsiz denemeyi başlat",
    ctaHref: `${APP_URL}/register`,
  },
  {
    key: "follow-up",
    label: "Takip / hatırlatma",
    description: "Yanıt vermeyen lead",
    subject: "{{Firma_Adi}} — EmlakFlow demosu hâlâ geçerli",
    body: `Sayın {{Yetkili_Ismi}},

Geçtiğimiz günlerde {{Firma_Adi}} için EmlakFlow'u kısaca tanıtmıştık. Portföy, vitrin ve talep eşleştirmesini tek panelde görmek isterseniz kısa bir demo ayarlayabiliriz.

Uygun bir zamanınız varsa yanıtlayın; size özel kurulumu birlikte açalım.`,
    ctaLabel: "Demo için kayıt olun",
    ctaHref: `${APP_URL}/register`,
  },
  {
    key: "premium-wl",
    label: "Premium / white-label",
    description: "Kurumsal marka + alan adı",
    subject: "{{Firma_Adi}} için kendi markanızla EmlakFlow",
    body: `Sayın {{Yetkili_Ismi}},

{{Firma_Adi}} gibi ofisler için Premium pakette panel ve vitrinde EmlakFlow gizlenir; kendi alan adınız, logonuz ve renklerinizle white-label çalışırsınız.

Kurulum ekibimizle birlikte domain ve marka ayarını tamamlayabiliriz.`,
    ctaLabel: "Premium hakkında bilgi alın",
    ctaHref: `${APP_URL}/#fiyatlar`,
  },
  {
    key: "custom",
    label: "Serbest",
    description: "Konu ve metni siz yazın",
    subject: "{{Firma_Adi}} — EmlakFlow",
    body: `Sayın {{Yetkili_Ismi}},

`,
  },
];

export function getAdminMarketingTemplate(
  key: string,
): AdminMarketingTemplate | undefined {
  return ADMIN_MARKETING_TEMPLATES.find((t) => t.key === key);
}

function fillPlaceholders(s: string, vars: AdminMarketingVars): string {
  const yetkili = vars.yetkiliIsmi?.trim() || "Yetkili";
  const firma = vars.firmaAdi.trim() || "Ofisiniz";
  const bolge = vars.bolge?.trim() || "";
  return s
    .replaceAll("{{Firma_Adi}}", firma)
    .replaceAll("{{Yetkili_Ismi}}", yetkili)
    .replaceAll("{{Bolge}}", bolge);
}

/** Düz metni ofis mail zarfına benzer HTML'e çevirir. */
function bodyToHtml(
  body: string,
  title: string,
  ctaLabel?: string,
  ctaHref?: string,
): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  const cta =
    ctaLabel && ctaHref
      ? `<p style="margin:28px 0">
      <a href="${ctaHref}" style="background:#1e5b3e;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;display:inline-block">
        ${ctaLabel}
      </a>
    </p>`
      : "";
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#17201c">
    <p style="font-size:18px;font-weight:800;margin:0 0 4px">Emlak<span style="color:#1e5b3e">Flow</span></p>
    <h1 style="font-size:20px;margin:24px 0 8px">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#4a544f">
      ${paragraphs}
    </div>
    ${cta}
    <p style="font-size:12px;line-height:1.6;color:#8a938e;margin-top:40px;border-top:1px solid #e1e8e4;padding-top:16px;">
      Saygılarımızla,<br><strong>EmlakFlow</strong>
    </p>
  </div>`;
}

export function renderAdminMarketingEmail(
  templateKey: string,
  vars: AdminMarketingVars,
  overrides?: { subject?: string; body?: string },
): { subject: string; html: string; text: string; templateKey: string } {
  const tpl =
    getAdminMarketingTemplate(templateKey) ??
    getAdminMarketingTemplate("demo-invite")!;

  const subject = fillPlaceholders(
    (overrides?.subject?.trim() || tpl.subject).slice(0, 150),
    vars,
  );
  const body = fillPlaceholders(
    (overrides?.body?.trim() || tpl.body).slice(0, 8000),
    vars,
  );
  const title = subject.replace(/^.*?—\s*/, "").slice(0, 80) || "EmlakFlow";

  return {
    templateKey: tpl.key,
    subject,
    text: body + (tpl.ctaHref ? `\n\n${tpl.ctaLabel ?? "Bağlantı"}: ${tpl.ctaHref}` : ""),
    html: bodyToHtml(body, title, tpl.ctaLabel, tpl.ctaHref),
  };
}

/** Geriye uyumluluk — eski demo daveti. */
export function renderMarketingLeadEmail(vars: {
  firmaAdi: string;
  yetkiliIsmi?: string | null;
}): { subject: string; html: string; text: string } {
  const { subject, html, text } = renderAdminMarketingEmail("demo-invite", vars);
  return { subject, html, text };
}
