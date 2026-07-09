import type { ComponentType } from "react";
import { EmlakCrmYazi } from "@/content/blog/emlak-crm";
import { ExceldenCrmGecisYazi } from "@/content/blog/excelden-crm-gecis";
import { PortfoyNasilToplanirYazi } from "@/content/blog/portfoy-nasil-toplanir";
import { EmlakOfisiAcmakYazi } from "@/content/blog/emlak-ofisi-acmak";
import { TopluEmlakIlaniYonetimiYazi } from "@/content/blog/toplu-emlak-ilani-yonetimi";
import { EmlakOfisiWebSitesiKurmaYazi } from "@/content/blog/emlak-ofisi-web-sitesi-kurma";
import { EmlakIlaniNasilYazilirYazi } from "@/content/blog/emlak-ilani-nasil-yazilir";
import { EmlakIlanFotografciligiYazi } from "@/content/blog/emlak-ilan-fotografciligi";
import { EvAlirkenDikkatYazi } from "@/content/blog/ev-alirken-dikkat-edilmesi-gereken-5-onemli-nokta";
import { EviniziSatisaHazirlamaYazi } from "@/content/blog/evinizi-satisa-hazirlamanin-puf-noktalari";
import { EmlakDanismaniSecimiYazi } from "@/content/blog/dogru-emlak-danismani-secmenin-avantajlari";
import { YatirimlikEvYazi } from "@/content/blog/yatirim-amacli-ev-alirken-hangi-bolgeler-tercih-edilmeli";
import { EvKiralamadanOnceYazi } from "@/content/blog/ev-kiralamadan-once-yapilmasi-gereken-kontroller";
import { AkilliEvYazi } from "@/content/blog/akilli-ev-teknolojilerinin-gayrimenkul-degerine-etkisi";
import { GayrimenkulMasraflariYazi } from "@/content/blog/gayrimenkul-alim-satiminda-ortaya-cikan-masraflar";
import { KrediFaizOranlariYazi } from "@/content/blog/kredi-faiz-oranlari-duserken-ev-almak-mantikli-mi";
import { YeniEvliCiftlerYazi } from "@/content/blog/yeni-evli-ciftler-icin-ideal-ev-secimi";
import { KentselDonusumYazi } from "@/content/blog/kentsel-donusum-surecinde-bilmeniz-gerekenler";
/**
 * Blog kayıt defteri — SEO içerik planının koda dökülmüş hâli
 * (strateji: docs/seo-buyume-plani.md §A2).
 *
 * İçerik dosya tabanlıdır (content/blog/*.tsx): CMS/DB yok, her yazı
 * deploy'la yayına girer ve tamamen statik (SSG) servis edilir.
 * Yeni yazı eklerken: content/blog/<slug>.tsx oluştur → buraya kaydet.
 * Title kuralları için §A2'ye bak (hedef kelime başta, ≤60 karakter,
 * yıl title'da olabilir ama slug'a asla girmez).
 */

export const BLOG_PILLARS = {
  kurulum: "Ofis Kurma ve Büyütme",
  portfoy: "Portföy Yönetimi",
  pazarlama: "Dijital Pazarlama",
  crm: "CRM ve Otomasyon",
  veri: "Piyasa Verisi",
} as const;

export type BlogPillarKey = keyof typeof BLOG_PILLARS;

export interface BlogPost {
  slug: string;
  /** SEO title etiketi — marka eki kök şablondan gelir (" | EmlakFlow") */
  title: string;
  /** Sayfadaki H1 — title'dan daha doğal/uzun olabilir */
  h1: string;
  description: string;
  keywords: string[];
  pillar: BlogPillarKey;
  publishedAt: string; // ISO tarih
  updatedAt: string;
  readingMinutes: number;
  Content: ComponentType;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "emlak-crm",
    title: "Emlak CRM Nedir? Doğru Yazılımı Seçme Rehberi",
    h1: "Emlak CRM Nedir? Ofisinize Doğru Yazılımı Seçme Rehberi",
    description:
      "Emlak CRM'i ne işe yarar, hangi ofise hangisi uygun? Portföy takibi, müşteri eşleştirme ve komisyon paylaşımına göre seçim kriterleri, karşılaştırma tablosuyla.",
    keywords: ["emlak crm", "emlak crm programı", "emlak ofisi yazılımı"],
    pillar: "crm",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 8,
    Content: EmlakCrmYazi,
  },
  {
    slug: "excelden-crm-gecis",
    title: "Excel'den Emlak CRM'e Geçiş: Neden ve Nasıl?",
    h1: "Excel'den Emlak CRM'e Geçiş: Neden ve Nasıl Yapılır?",
    description:
      "Emlak ofisinizi Excel'le mi yönetiyorsunuz? Excel'in görünmez maliyetleri, CRM'e geçişin 5 adımı ve veri taşıma kontrol listesi bu rehberde.",
    keywords: ["emlak excel takip", "excel crm geçiş", "emlak portföy excel"],
    pillar: "crm",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 7,
    Content: ExceldenCrmGecisYazi,
  },
  {
    slug: "portfoy-nasil-toplanir",
    title: "Emlakçılıkta Portföy Nasıl Toplanır? 7 Kanıtlı Yöntem",
    h1: "Emlakçılıkta Portföy Nasıl Toplanır? 7 Kanıtlı Yöntem",
    description:
      "Bölgede yeni misiniz, portföy mü bulamıyorsunuz? Kapı kapı gezmekten dijital vitrine, 7 kanıtlanmış portföy toplama yöntemi ve ilk 30 gün planı.",
    keywords: [
      "emlakçılıkta portföy nasıl toplanır",
      "portföy toplama",
      "emlak portföy bulma",
    ],
    pillar: "portfoy",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 9,
    Content: PortfoyNasilToplanirYazi,
  },
  {
    slug: "emlak-ofisi-acmak",
    title: "Emlak Ofisi Nasıl Açılır? 2026 Adım Adım Rehber",
    h1: "Emlak Ofisi Nasıl Açılır? 2026 Adım Adım Kuruluş Rehberi",
    description:
      "Taşınmaz ticareti yetki belgesinden ofis maliyetine, vergiden ilk müşteriye: 2026'da emlak ofisi açmanın eksiksiz yol haritası.",
    keywords: [
      "emlak ofisi nasıl açılır",
      "emlak ofisi açmak",
      "taşınmaz ticareti yetki belgesi",
    ],
    pillar: "kurulum",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 10,
    Content: EmlakOfisiAcmakYazi,
  },
  {
    slug: "toplu-emlak-ilani-yonetimi",
    title: "Toplu Emlak İlanı Yönetimi: Tek Panelden Yayın",
    h1: "Toplu Emlak İlanı Yönetimi: Tüm İlanları Tek Panelden Yönetin",
    description:
      "İlanları portala, siteye ve sosyal medyaya ayrı ayrı mı giriyorsunuz? Tek doğru kaynak düzeni, toplu işlemler ve XML feed ile ilan yönetimi rehberi.",
    keywords: [
      "toplu emlak ilanı",
      "toplu ilan girişi",
      "emlak ilan yönetim programı",
    ],
    pillar: "crm",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 7,
    Content: TopluEmlakIlaniYonetimiYazi,
  },
  {
    slug: "emlak-ofisi-web-sitesi-kurma",
    title: "Emlak Ofisi Web Sitesi Kurma: 2026 Rehberi",
    h1: "Emlak Ofisi Web Sitesi Nasıl Kurulur? 2026 Rehberi",
    description:
      "Hazır site mi, WordPress mi, CRM'e bağlı vitrin mi? Üç yolun karşılaştırması, olmazsa olmaz 7 özellik ve alan adı + Google kurulum adımları.",
    keywords: [
      "emlak ofisi web sitesi",
      "emlak web sitesi kurma",
      "emlak sitesi fiyatları",
    ],
    pillar: "pazarlama",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 8,
    Content: EmlakOfisiWebSitesiKurmaYazi,
  },
  {
    slug: "emlak-ilani-nasil-yazilir",
    title: "Emlak İlanı Nasıl Yazılır? Satan Başlık Formülü",
    h1: "Emlak İlanı Nasıl Yazılır? Satan Başlık ve Açıklama Formülü",
    description:
      "Aynı daire neden birinde 40, diğerinde 400 tıklama alır? Başlık formülü, 4 paragraflık açıklama yapısı ve kötü→iyi dönüşüm tablosu bu rehberde.",
    keywords: [
      "emlak ilanı nasıl yazılır",
      "satılık daire ilan örneği",
      "ilan başlığı örnekleri",
    ],
    pillar: "pazarlama",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 7,
    Content: EmlakIlaniNasilYazilirYazi,
  },
  {
    slug: "emlak-ilan-fotografciligi",
    title: "İlan Fotoğrafçılığı: Telefonla Profesyonel Çekim",
    h1: "Emlak İlan Fotoğrafçılığı: Telefonla Profesyonel Çekim Rehberi",
    description:
      "Profesyonel ekipman gerekmez: hazırlık listesi, ışık saatleri, açı kuralları ve oda oda çekim planıyla ilan fotoğraflarınızı vitrin kalitesine taşıyın.",
    keywords: [
      "emlak ilan fotoğrafı",
      "emlak fotoğrafçılığı",
      "ilan fotoğrafı nasıl çekilir",
    ],
    pillar: "portfoy",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 8,
    Content: EmlakIlanFotografciligiYazi,
  },
  {
    slug: "ev-alirken-dikkat-edilmesi-gereken-5-onemli-nokta",
    title: "Ev Alırken Dikkat Edilmesi Gereken 5 Önemli Nokta",
    h1: "Ev Alırken Dikkat Edilmesi Gereken 5 Önemli Nokta",
    description: "Yeni bir ev almak, hayatınızdaki en önemli ve finansal açıdan en büyük kararlardan biridir. Ev satın alma sürecini sorunsuz ve güvenli bir şekilde atlatmanız için dikkat etmeniz gereken 5 temel kriter.",
    keywords: ["ev alırken dikkat", "ev alma rehberi", "gayrimenkul alma"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 6,
    Content: EvAlirkenDikkatYazi,
  },
  {
    slug: "evinizi-satisa-hazirlamanin-puf-noktalari",
    title: "Evinizi Satışa Hazırlamanın Püf Noktaları",
    h1: "Evinizi Satışa Hazırlamanın Püf Noktaları",
    description: "Evinizi satılığa çıkardığınızda, artık sizin yuvanız olmaktan çıkıp pazarlanan bir ürün haline gelir. Evinizi piyasa değerinde ve hızlı bir şekilde satmak için onu en iyi şekilde vitrine koymalısınız.",
    keywords: ["ev satışı", "ev satma taktikleri", "emlak pazarlama"],
    pillar: "pazarlama",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 5,
    Content: EviniziSatisaHazirlamaYazi,
  },
  {
    slug: "dogru-emlak-danismani-secmenin-avantajlari",
    title: "Doğru Emlak Danışmanı Seçmenin Avantajları",
    h1: "Doğru Emlak Danışmanı Seçmenin Avantajları",
    description: "Gayrimenkul işlemleri sadece bir yer gösterme işi değil; ciddi finansal, hukuki ve pazarlama bilgi birikimi gerektiren bir süreçtir. Doğru emlak danışmanı bir maliyet değil, yatırımdır.",
    keywords: ["emlak danışmanı", "emlakçı seçimi", "profesyonel emlak hizmeti"],
    pillar: "portfoy",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 5,
    Content: EmlakDanismaniSecimiYazi,
  },
  {
    slug: "yatirim-amacli-ev-alirken-hangi-bolgeler-tercih-edilmeli",
    title: "Yatırım Amaçlı Ev Alırken Hangi Bölgeler Tercih Edilmeli?",
    h1: "Yatırım Amaçlı Ev Alırken Hangi Bölgeler Tercih Edilmeli?",
    description: "Gayrimenkul yatırımı, enflasyona karşı parayı korumanın ve uzun vadede pasif gelir elde etmenin en güvenilir yoludur. Yatırımcıların radarında olması gereken bölgeler.",
    keywords: ["gayrimenkul yatırım", "yatırımlık ev", "emlak değer artışı"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 6,
    Content: YatirimlikEvYazi,
  },
  {
    slug: "ev-kiralamadan-once-yapilmasi-gereken-kontroller",
    title: "Ev Kiralamadan Önce Yapılması Gereken Kontroller",
    h1: "Ev Kiralamadan Önce Yapılması Gereken Kontroller",
    description: "Yeni bir kiralık ev buldunuz. Ancak hemen sözleşmeyi imzalamadan önce evi ve hukuki şartları ince eleyip sık dokumanız gerekir.",
    keywords: ["ev kiralama", "kira sözleşmesi", "kiralık ev kontrolleri"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 5,
    Content: EvKiralamadanOnceYazi,
  },
  {
    slug: "akilli-ev-teknolojilerinin-gayrimenkul-degerine-etkisi",
    title: "Akıllı Ev Teknolojilerinin Gayrimenkul Değerine Etkisi",
    h1: "Akıllı Ev Teknolojilerinin Gayrimenkul Değerine Etkisi",
    description: "Akıllı ev sistemleri artık lüks olmaktan çıkıp bir ihtiyaç haline geliyor ve mülk değerini doğrudan etkiliyor.",
    keywords: ["akıllı ev", "gayrimenkul değeri", "teknolojik ev"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 4,
    Content: AkilliEvYazi,
  },
  {
    slug: "gayrimenkul-alim-satiminda-ortaya-cikan-masraflar",
    title: "Gayrimenkul Alım Satımında Ortaya Çıkan Masraflar",
    h1: "Gayrimenkul Alım Satımında Ortaya Çıkan Masraflar",
    description: "Ev alırken veya satarken, üzerinde anlaşılan satış bedeli dışında da ciddi bir bütçe ayırmanız gereken resmi masraflar vardır.",
    keywords: ["tapu harcı", "emlak alım masrafları", "gayrimenkul giderleri"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 5,
    Content: GayrimenkulMasraflariYazi,
  },
  {
    slug: "kredi-faiz-oranlari-duserken-ev-almak-mantikli-mi",
    title: "Kredi Faiz Oranları Düşerken Ev Almak Mantıklı mı?",
    h1: "Kredi Faiz Oranları Düşerken Ev Almak Mantıklı mı?",
    description: "Faiz oranlarındaki düşüş, konut kredisiyle ev almayı planlayanlar için harika bir fırsat gibi görünür. Ancak gayrimenkul piyasasının kendine has bir dinamiği vardır.",
    keywords: ["konut kredisi", "faiz oranları", "krediyle ev almak"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 5,
    Content: KrediFaizOranlariYazi,
  },
  {
    slug: "yeni-evli-ciftler-icin-ideal-ev-secimi",
    title: "Yeni Evli Çiftler İçin İdeal Ev Seçimi",
    h1: "Yeni Evli Çiftler İçin İdeal Ev Seçimi",
    description: "Yeni bir hayata başlarken doğru evi seçmek, gelecekteki mutluluğunuz için çok önemlidir. Yeni evli çiftler ev ararken hangi noktalara odaklanmalıdır?",
    keywords: ["yeni evliler", "ilk ev", "ideal ev seçimi"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 4,
    Content: YeniEvliCiftlerYazi,
  },
  {
    slug: "kentsel-donusum-surecinde-bilmeniz-gerekenler",
    title: "Kentsel Dönüşüm Sürecinde Bilmeniz Gerekenler",
    h1: "Kentsel Dönüşüm Sürecinde Bilmeniz Gerekenler",
    description: "Eski binaların yıkılarak yeniden inşa edilmesi süreci kentsel dönüşümdür. Ülkemiz için hayati öneme sahip bu süreçte bilinmesi gerekenler.",
    keywords: ["kentsel dönüşüm", "riskli yapı", "kentsel dönüşüm kira yardımı"],
    pillar: "veri",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-10",
    readingMinutes: 6,
    Content: KentselDonusumYazi,
  },
];

/** Slug → yazı; yoksa undefined (sayfa 404'e düşer). */
export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Aynı pillar'dan diğer yazılar — "İlgili yazılar" bölümü için. */
export function relatedPosts(post: BlogPost, take = 3): BlogPost[] {
  const same = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.pillar === post.pillar,
  );
  const rest = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.pillar !== post.pillar,
  );
  return [...same, ...rest].slice(0, take);
}

/**
 * Yayın backlog'u — §A2'deki planın henüz yazılmamış kısmı.
 * Yazı hazır olunca: content/blog/'a taşı, BLOG_POSTS'a ekle, buradan sil.
 */
export const PLANNED_POSTS: Array<{
  slug: string;
  title: string;
  pillar: BlogPillarKey;
  targetKeyword: string;
}> = [
  { slug: "tasinmaz-ticareti-yetki-belgesi", title: "Taşınmaz Ticareti Yetki Belgesi Nasıl Alınır? (2026)", pillar: "kurulum", targetKeyword: "taşınmaz ticareti yetki belgesi" },
  { slug: "emlak-ofisi-acma-maliyeti", title: "Emlak Ofisi Açma Maliyeti 2026: Kalem Kalem Tablo", pillar: "kurulum", targetKeyword: "emlak ofisi açma maliyeti" },
  { slug: "emlak-franchise-mi-bagimsiz-mi", title: "Emlak Franchise mı Bağımsız Ofis mi? Karşılaştırma", pillar: "kurulum", targetKeyword: "emlak franchise" },
  { slug: "emlak-ofisi-ilk-90-gun", title: "Yeni Emlak Ofisinin İlk 90 Günü: Haftalık Plan", pillar: "kurulum", targetKeyword: "yeni emlakçı ne yapmalı" },
  { slug: "emlak-portfoy-yonetimi", title: "Emlak Portföy Yönetimi: Toplama, Takip ve Satış", pillar: "portfoy", targetKeyword: "emlak portföy yönetimi" },
  { slug: "yer-gosterme-sureci", title: "Yer Gösterme Süreci: Formdan Kaparoya Adım Adım", pillar: "portfoy", targetKeyword: "yer gösterme" },
  { slug: "emsal-analizi-fiyat-belirleme", title: "Emlak Fiyatı Nasıl Belirlenir? Emsal Analizi Rehberi", pillar: "portfoy", targetKeyword: "emlak değerleme nasıl yapılır" },
  { slug: "emlak-dijital-pazarlama", title: "Emlak Ofisleri için Dijital Pazarlama Rehberi 2026", pillar: "pazarlama", targetKeyword: "emlak dijital pazarlama" },
  { slug: "instagramda-emlak-pazarlama", title: "Instagram'da Emlak İlanı Pazarlama: İçerik Takvimi", pillar: "pazarlama", targetKeyword: "emlak instagram" },
  { slug: "emlakci-google-isletme-profili", title: "Google İşletme Profili ile Semtinizde 1. Sıraya Çıkın", pillar: "pazarlama", targetKeyword: "emlakçı google haritalar" },
  { slug: "whatsapp-musteri-takibi", title: "WhatsApp ile Müşteri Takibi: Emlakçı Mesaj Şablonları", pillar: "pazarlama", targetKeyword: "whatsapp müşteri takibi" },
  { slug: "alici-portfoy-eslestirme", title: "Alıcı-Portföy Eşleştirme: Talebi Satışa Çeviren Sistem", pillar: "crm", targetKeyword: "alıcı eşleştirme" },
  { slug: "emlak-komisyon-paylasimi", title: "Emlakçı Komisyon Paylaşımı: Modeller ve Hesaplama", pillar: "crm", targetKeyword: "emlak komisyon paylaşımı" },
  { slug: "kira-takibi", title: "Kira Takibi Nasıl Yapılır? Otomatik Hatırlatma Sistemi", pillar: "crm", targetKeyword: "kira takip programı" },
];
