import Link from "next/link";

/** Cluster yazısı — hedef: "emlak ofisi web sitesi" (bkz. lib/blog.ts) */
export function EmlakOfisiWebSitesiKurmaYazi() {
  return (
    <>
      <p>
        Mülk sahibi size portföyünü emanet etmeden önce iki şey yapar:
        çevresine sorar ve <strong>adınızı Google&apos;a yazar</strong>.
        Karşısına derli toplu bir site çıkarsa görüşme yarı yarıya
        kazanılmıştır; hiçbir şey çıkmazsa portala mahkum, markasız bir
        aracı görür. Bu rehber, 2026&apos;da bir emlak ofisi sitesinin
        nasıl kurulacağını üç yol üzerinden karşılaştırır ve olmazsa olmaz
        özellik listesini verir.
      </p>

      <h2>Emlak ofisi sitesi ne İŞE yarar — ne değildir?</h2>
      <p>
        Ofis sitesi portalların rakibi değildir; portal trafiği devasa,
        siteniz yenidir. Sitenizin üç gerçek görevi:
      </p>
      <ul>
        <li>
          <strong>Güven vitrini:</strong> Portföyünüz, satılanlarınız,
          ekibiniz — &ldquo;bu ofis işini biliyor&rdquo; kanıtı.
        </li>
        <li>
          <strong>Talep toplayıcı:</strong> &ldquo;Aradığınızı bulamadınız
          mı?&rdquo; formu dolduran her ziyaretçi, kayıtlı bir alıcı
          talebidir — portalda bu müşteri portalın müşterisidir, sitenizde
          sizindir.
        </li>
        <li>
          <strong>Semt SEO&apos;su:</strong> &ldquo;X mahallesi satılık
          daire&rdquo; aramasında portallarla yarışamazsınız ama
          &ldquo;X mahallesi emlakçı&rdquo; aramasını Google İşletme
          Profili + siteniz ikilisiyle kazanabilirsiniz.
        </li>
      </ul>

      <h2>Üç kuruluş yolu karşılaştırması</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Hazır site (Wix vb.)</th>
            <th>WordPress + tema</th>
            <th>CRM&apos;e bağlı vitrin</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kurulum</td>
            <td>1 gün</td>
            <td>1-2 hafta (geliştirici)</td>
            <td>Dakikalar (panelden açılır)</td>
          </tr>
          <tr>
            <td>İlan güncelleme</td>
            <td>Elle, ikinci kez</td>
            <td>Elle veya eklentiyle</td>
            <td>Otomatik — panel neyse site o</td>
          </tr>
          <tr>
            <td>Bakım / güvenlik</td>
            <td>Platformda</td>
            <td>Sizde (eklenti güncellemeleri)</td>
            <td>Sağlayıcıda</td>
          </tr>
          <tr>
            <td>Talep formu → CRM</td>
            <td>E-postaya düşer</td>
            <td>Entegrasyon gerekir</td>
            <td>Doğrudan müşteri kaydı olur</td>
          </tr>
          <tr>
            <td>Kime uygun</td>
            <td>Tek sayfalık kartvizit isteyen</td>
            <td>Özel tasarım isteyen büyük ofis</td>
            <td>Portföyü aktif yöneten her ofis</td>
          </tr>
        </tbody>
      </table>
      <p>
        Belirleyici soru şudur: <strong>ilanlarınız sitede nasıl güncel
        kalacak?</strong> Sitenin en pahalı hâli, kurulan ama bayatlayan
        sitedir — &ldquo;satıldı&rdquo; yazmayan satılmış daireler güven
        vitrinini güvensizlik vitrinine çevirir. Bu yüzden ilan sayısı 15&apos;i
        geçen ofis için pratik cevap, ilanların tek kaynaktan beslendiği
        CRM-vitrin modelidir — mimarinin tamamı{" "}
        <Link href="/blog/toplu-emlak-ilani-yonetimi">
          toplu ilan yönetimi rehberinde
        </Link>
        .
      </p>

      <h2>Olmazsa olmaz özellik listesi</h2>
      <ol>
        <li><strong>Harita üzerinde portföy</strong> — alıcı semtle arar,
          listeyle değil</li>
        <li><strong>İlan detayında SEO</strong> — her ilanın kendi
          başlığı, açıklaması ve paylaşılabilir linki</li>
        <li><strong>Filtreleme</strong> — oda, bütçe, ilçe, m²</li>
        <li><strong>Talep formu</strong> — spam korumalı, doğrudan
          panele düşen</li>
        <li><strong>WhatsApp/telefon tek tık</strong> — mobil ziyaretçi
          %80&apos;dir</li>
        <li><strong>Satılanlar bölümü</strong> — sosyal kanıt, portföy
          getirir (bkz.{" "}
          <Link href="/blog/portfoy-nasil-toplanir">portföy toplama</Link>)</li>
        <li><strong>Hız</strong> — 3 saniyede açılmayan mobil sayfa,
          kapanmış sayfadır</li>
      </ol>

      <h2>Alan adı ve Google kurulumu</h2>
      <ul>
        <li>Alan adı: kısa, ofis adıyla aynı, <strong>.com</strong> veya
          .com.tr — semt adı eklemek (ör. kadikoyemlak.com) marka
          büyüyünce dar gelir.</li>
        <li>Site açılır açılmaz <strong>Google Search Console</strong>&apos;a
          ekleyin, sitemap gönderin.</li>
        <li><strong>Google İşletme Profili</strong>ne siteyi bağlayın —
          semt aramalarının kazanıldığı yer profil + site ikilisidir.</li>
      </ul>

      <h2>Sık sorulan sorular</h2>
      <h3>Emlak ofisi web sitesi maliyeti ne kadar?</h3>
      <p>
        Hazır platformlarda aylık abonelik; WordPress&apos;te tasarım +
        yıllık bakım; CRM-vitrin modelinde çoğunlukla CRM aboneliğine
        dahildir. Karşılaştırırken tek soruyu sorun: ilan güncelleme
        emeği fiyata dahil mi?
      </p>
      <h3>Portal varken siteye gerek var mı?</h3>
      <p>
        Portal ilan satar, site <strong>ofisi</strong> satar. Portföy
        vermeye karar veren mülk sahibi portalda değil, Google&apos;da sizi
        arar — orada ne bulacağı sizin elinizde.
      </p>
    </>
  );
}
