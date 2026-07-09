/**
 * Super-admin outbound pazarlama kampanyası e-posta şablonu.
 * Değişkenler: {{Firma_Adi}}, {{Yetkili_Ismi}}
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://emlakflow.app";

export function renderMarketingLeadEmail(vars: {
  firmaAdi: string;
  yetkiliIsmi?: string | null;
}): { subject: string; html: string; text: string } {
  const yetkili = vars.yetkiliIsmi?.trim() || "Yetkili";
  const firma = vars.firmaAdi.trim() || "Ofisiniz";

  const templateHtml = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#17201c">
    <p style="font-size:18px;font-weight:800;margin:0 0 4px">Emlak<span style="color:#1e5b3e">Flow</span></p>
    <h1 style="font-size:20px;margin:24px 0 8px">{{Firma_Adi}} için kısa bir not</h1>
    <div style="font-size:14px;line-height:1.6;color:#4a544f">
      <p>Sayın <strong>{{Yetkili_Ismi}}</strong>,</p>
      <p>
        <strong>{{Firma_Adi}}</strong> ekibinin portföyünü tek panelden yönetmesi,
        vitrin sitesini dakikalar içinde yayına alması ve talepleri ilanlarla
        eşleştirmesi için EmlakFlow'u hazırladık.
      </p>
      <p>15 dakikalık bir demo ile ofisinize özel kurulumu birlikte bakabiliriz.</p>
    </div>
    <p style="margin:28px 0">
      <a href="${APP_URL}/register" style="background:#1e5b3e;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;display:inline-block">
        Ücretsiz denemeyi başlat
      </a>
    </p>
    <p style="font-size:12px;line-height:1.6;color:#8a938e;margin-top:40px;border-top:1px solid #e1e8e4;padding-top:16px;">
      Saygılarımızla,<br><strong>EmlakFlow</strong>
    </p>
  </div>`;

  const templateText = `Sayın {{Yetkili_Ismi}},

{{Firma_Adi}} için EmlakFlow ile portföy, vitrin ve talep eşleştirmesini tek panelden yönetebilirsiniz.

Ücretsiz deneme: ${APP_URL}/register

Saygılarımızla,
EmlakFlow`;

  const replace = (s: string) =>
    s
      .replaceAll("{{Firma_Adi}}", firma)
      .replaceAll("{{Yetkili_Ismi}}", yetkili);

  return {
    subject: `${firma} için EmlakFlow — kısa bir tanıtım`,
    html: replace(templateHtml),
    text: replace(templateText),
  };
}
