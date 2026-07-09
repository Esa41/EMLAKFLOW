/**
 * Sohbet → E-postalar sekmesinde seçilebilir hazır şablonlar.
 * Metinler docs/mail-templates/ ile uyumlu; gönderim POST /api/mails/custom
 * üzerinden ofis markalı HTML zarfa sarılır.
 */

export type MailComposeTemplate = {
  id: string;
  label: string;
  description: string;
  subject: string;
  /** Düz metin gövde — [Müşteri Adı] vb. yer tutucular */
  body: string;
};

export const MAIL_COMPOSE_TEMPLATES: MailComposeTemplate[] = [
  {
    id: "welcome",
    label: "Hoş geldin",
    description: "Yeni müşteri / üye",
    subject: "Ailemize Hoş Geldiniz",
    body: `Sayın [Müşteri Adı],

Gayrimenkul arayışınızda bizimle iletişime geçtiğiniz için teşekkür ederiz. Beklentilerinize en uygun gayrimenkulü bulma sürecinizde size profesyonel destek sağlamaktan memnuniyet duyacağız.

Portföyümüzdeki size özel seçenekleri değerlendirmek ve taleplerinizi detaylandırmak adına danışmanlarımız en kısa sürede sizinle iletişime geçecektir.`,
  },
  {
    id: "new-listing",
    label: "Yeni portföy",
    description: "İlan önerisi",
    subject: "Arayışınıza Uygun Yeni İlanımız Yayında",
    body: `Sayın [Müşteri Adı],

Kriterlerinize uygun, portföyümüze yeni eklenen [İlan Başlığı] isimli gayrimenkulü dikkatinize sunmak isteriz.

Detaylıca incelemek ve yer gösterimi randevusu oluşturmak için şu bağlantıyı ziyaret edebilirsiniz:
[İlan Linki]`,
  },
  {
    id: "price-drop",
    label: "Fiyat düşüşü",
    description: "Favori / ilgilendiği ilan",
    subject: "İlgilendiğiniz Mülkte Fiyat Güncellemesi",
    body: `Sayın [Müşteri Adı],

Yakın zamanda incelediğiniz [İlan Başlığı] isimli mülkün fiyatında sizin lehinize bir güncelleme gerçekleşti.

Önceki Fiyat: [Eski Fiyat]
Yeni Fiyat: [Yeni Fiyat]

Bu fırsatı değerlendirmek isterseniz bize ulaşabilir veya ilan sayfasını tekrar ziyaret edebilirsiniz:
[İlan Linki]`,
  },
  {
    id: "reengagement",
    label: "Kendini hatırlatma",
    description: "Sessiz kalan müşteri",
    subject: "Size Nasıl Yardımcı Olabiliriz?",
    body: `Sayın [Müşteri Adı],

Geçtiğimiz dönemde gayrimenkul ihtiyaçlarınızla ilgili sizinle iletişimde bulunmuştuk. Güncel gelişmeler ve portföyümüze yeni eklenen seçenekler doğrultusunda arayışınızın devam edip etmediğini öğrenmek isteriz.

Beklentilerinizde değişiklik olduysa kriterlerinizi güncelleyerek size en uygun alternatifleri sunmaya hazırız.`,
  },
  {
    id: "appointment",
    label: "Randevu hatırlatma",
    description: "Yaklaşan görüşme",
    subject: "Hatırlatma: Randevunuz",
    body: `Sayın [Müşteri Adı],

Planladığımız görüşmemizin detaylarını bilgilerinize sunarız:

Tarih: [Randevu Tarihi]
Saat: [Randevu Saati]
Konum: [Görüşme Konumu]

Değişiklik veya iptal talebiniz olması durumunda lütfen bizimle önceden iletişime geçiniz. Görüşmek dileğiyle.`,
  },
];

/** Alıcı adı varsa [Müşteri Adı] yer tutucusunu doldurur. */
export function applyMailTemplate(
  template: MailComposeTemplate,
  customerName?: string,
): { subject: string; body: string } {
  const name = customerName?.trim();
  const replaceName = (s: string) =>
    name ? s.replaceAll("[Müşteri Adı]", name) : s;
  return {
    subject: replaceName(template.subject),
    body: replaceName(template.body),
  };
}
