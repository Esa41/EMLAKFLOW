import Link from "next/link";

/** Cluster yazısı — hedef: "toplu emlak ilanı" / "emlak ilan yönetim programı" */
export function TopluEmlakIlaniYonetimiYazi() {
  return (
    <>
      <p>
        Orta ölçekli bir emlak ofisi 40-80 aktif ilanla çalışır ve her ilan
        en az üç yerde yaşar: portallar, ofisin kendi sitesi ve sosyal medya.
        Aynı dairenin fiyatını üç yerde elle güncelleyen ofis, er ya da geç
        müşterisine <strong>bayat fiyat</strong> gösterir — ve pazarlık
        masasına güven kaybıyla oturur. Toplu ilan yönetiminin amacı tek
        cümledir: <strong>ilanı bir kez gir, her yerde güncel tut.</strong>
      </p>

      <h2>Dağınık ilan yönetiminin gerçek maliyeti</h2>
      <ul>
        <li>
          <strong>Çift veri girişi:</strong> 50 ilanlık portföyde her ilanı
          3 platforma girmek, fotoğraf ve açıklamalarıyla 15-20 dakikadır.
          Toplamda haftalarca danışman mesaisi, yılda binlerce lira gizli
          maliyet.
        </li>
        <li>
          <strong>Tutarsız bilgi:</strong> Portalda 12,5 milyon, sitede 13
          milyon görünen daire alıcı gözünde &ldquo;pazarlığı açık&rdquo;
          değil &ldquo;güvenilmez&rdquo; demektir.
        </li>
        <li>
          <strong>Unutulan ilanlar:</strong> Satılan dairenin ilanı bir
          platformda yayında kalır; arayan müşteriye &ldquo;o satıldı&rdquo;
          demek, ofisin vitrinine atılmış gol niteliğindedir.
        </li>
      </ul>

      <h2>Tek doğru kaynak (single source of truth) kurulumu</h2>
      <p>
        Çözümün mimarisi basittir: ilanın <strong>tek bir ana kaydı</strong>{" "}
        olur; diğer her mecra bu kayıttan beslenir. Pratikte üç katman:
      </p>
      <ol>
        <li>
          <strong>Ana kayıt (CRM/panel):</strong> Fotoğraflar, fiyat, durum,
          tapu bilgisi, konum — hepsi burada. Fiyat burada değişir,
          başka hiçbir yerde elle dokunulmaz.
        </li>
        <li>
          <strong>Otomatik beslenen vitrin:</strong> Ofisin kendi sitesi ana
          kayıttan canlı beslenir; ilan girildiği an sitede, satıldığı an
          arşivde. Vitrin kurulumu için{" "}
          <Link href="/blog/emlak-ofisi-web-sitesi-kurma">
            web sitesi rehberine
          </Link>{" "}
          bakın.
        </li>
        <li>
          <strong>Portal yayını:</strong> Portala kopyalanan ilanın açıklama
          sonuna ilan kodu ve vitrin linki eklenir; müşteri detay için
          ofisin kendi sayfasına gelir — iletişim de, marka da ofiste kalır.
        </li>
      </ol>

      <h2>Toplu işlemler: nerede zaman kazanılır?</h2>
      <table>
        <thead>
          <tr>
            <th>İşlem</th>
            <th>Elle (ilan başı)</th>
            <th>Tek panelden</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fiyat güncelleme</td>
            <td>3 platform × 5 dk</td>
            <td>Tek alan, anında her yerde</td>
          </tr>
          <tr>
            <td>Satıldı/kiralandı işaretleme</td>
            <td>3 platformda yayından kaldırma</td>
            <td>Durum değişikliği → vitrin otomatik</td>
          </tr>
          <tr>
            <td>Fotoğraf yenileme</td>
            <td>Her platforma yeniden yükleme</td>
            <td>Ana kayıtta değiştir, vitrine düşer</td>
          </tr>
          <tr>
            <td>Danışman devri</td>
            <td>İlan ilan iletişim değişikliği</td>
            <td>Toplu atama</td>
          </tr>
        </tbody>
      </table>

      <h2>Toplu ilan girişinde kalite standardı</h2>
      <p>
        Hız, özensizliğin bahanesi olmamalı. Her ilan için asgari standart
        belirleyin ve panele girmeden yayına çıkmasın:
      </p>
      <ul>
        <li>En az 8 fotoğraf, kapak karesi salondan — çekim standardı için{" "}
          <Link href="/blog/emlak-ilan-fotografciligi">
            ilan fotoğrafçılığı rehberi
          </Link>
        </li>
        <li>Başlıkta konum + oda + m² —{" "}
          <Link href="/blog/emlak-ilani-nasil-yazilir">
            ilan yazma formülü
          </Link>
        </li>
        <li>Net/brüt m², kat, bina yaşı, aidat eksiksiz</li>
        <li>İlan kodu (ref no) — telefonla arayan müşteriyi 5 saniyede
          bulmanın anahtarı</li>
      </ul>

      <blockquote>
        Ölçüt şudur: yeni gelen bir danışman, hiçbir şey sormadan panele
        bakarak herhangi bir ilanın güncel durumunu söyleyebiliyorsa toplu
        yönetim kurulmuştur.
      </blockquote>

      <h2>Sık sorulan sorular</h2>
      <h3>Portallara otomatik ilan basılabilir mi (XML entegrasyonu)?</h3>
      <p>
        Büyük portallar kurumsal üyelere XML/feed ile toplu ilan aktarımı
        sunar. Feed, ana kayıttan üretildiğinde &ldquo;bir kez gir, her
        yerde yayınla&rdquo; tam otomatiğe döner; ancak entegrasyonsuz bile
        tek-ana-kayıt düzeni zaman kaybının büyük kısmını çözer.
      </p>
      <h3>Kaç ilandan sonra panel şart olur?</h3>
      <p>
        Pratik eşik 15-20 aktif ilandır. Üzerine ekip eklendiğinde
        (2+ danışman) tek doğru kaynak olmadan tutarlılık fiilen imkansızdır
        — bkz. <Link href="/blog/emlak-crm">emlak CRM rehberi</Link>.
      </p>
    </>
  );
}
