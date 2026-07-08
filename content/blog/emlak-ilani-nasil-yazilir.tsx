import Link from "next/link";

/** Cluster yazısı — hedef: "emlak ilanı nasıl yazılır" */
export function EmlakIlaniNasilYazilirYazi() {
  return (
    <>
      <p>
        Aynı daire, aynı fiyat, aynı fotoğraflar — biri 40 tıklama alır,
        diğeri 400. Aradaki fark çoğu zaman iki satırdır: başlık ve
        açıklamanın ilk cümlesi. Bu rehber, portal içi aramada öne çıkan
        ve telefonu çaldıran ilan metninin formülünü verir; kötü/iyi
        örnek tablosuyla.
      </p>

      <h2>Başlık formülü: KONUM + TİP + AYIRT EDİCİ</h2>
      <p>
        Alıcı portalda semtle ve oda sayısıyla arar; başlığınız bu aramanın
        diliyle yazılmalıdır:
      </p>
      <blockquote>
        [Mahalle/Site]&apos;de [Oda] [Tip], [m²] — [tek ayırt edici özellik]
      </blockquote>
      <ul>
        <li>&ldquo;Moda&apos;da 3+1 Daire, 145 m² — Deniz Manzaralı Köşe
          Cephe&rdquo;</li>
        <li>&ldquo;Ataşehir Sitesinde 2+1, 98 m² — Metro 5 Dakika,
          Ebeveyn Banyolu&rdquo;</li>
      </ul>
      <p>
        <strong>Tek</strong> ayırt edici seçin — üç özellik sıralanan başlık
        hiçbirini vurgulamaz. BÜYÜK HARF, çoklu ünlem ve
        &ldquo;FIRSAT!!!&rdquo; kalıbı ise alıcı gözünde ucuzlatıcıdır,
        ciddiyet fiyatın parçasıdır.
      </p>

      <h2>Açıklamanın 4 paragraf yapısı</h2>
      <ol>
        <li>
          <strong>Yaşam cümlesi (1-2 satır):</strong> Alıcının hayatına
          dokunan tek fikir. &ldquo;Sabah kahvesini deniz gören balkonda
          içeceğiniz güneydoğu cephe.&rdquo; Metrekare değil, sahne satar.
        </li>
        <li>
          <strong>Teknik blok:</strong> Net/brüt m², kat/toplam kat, bina
          yaşı, ısıtma, aidat, cephe, otopark, krediye uygunluk — kısa
          maddeler halinde. Eksik teknik bilgi = gereksiz telefon trafiği
          + güven kaybı.
        </li>
        <li>
          <strong>Konum bloğu:</strong> Yürüme mesafesiyle konuşun:
          &ldquo;metroya 4 dk, okula 6 dk&rdquo;. &ldquo;Merkezi
          konumda&rdquo; hiçbir şey söylemez.
        </li>
        <li>
          <strong>Kapanış + çağrı:</strong> İlan kodu ve net yönlendirme:
          &ldquo;Yer gösterimi için EF-1042 koduyla arayın.&rdquo;
        </li>
      </ol>

      <h2>Kötü → iyi dönüşüm tablosu</h2>
      <table>
        <thead>
          <tr>
            <th>Kötü</th>
            <th>İyi</th>
            <th>Neden?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ACİL SATILIK FIRSAT DAİRE!!!</td>
            <td>Göztepe&apos;de 3+1, 130 m² — Yenilenmiş Mutfak</td>
            <td>Arama diliyle eşleşir, ciddiyet korunur</td>
          </tr>
          <tr>
            <td>&ldquo;Merkezi konumda kaçmaz&rdquo;</td>
            <td>&ldquo;Marmaray 5 dk, sahil 8 dk yürüme&rdquo;</td>
            <td>Doğrulanabilir bilgi güven verir</td>
          </tr>
          <tr>
            <td>&ldquo;Masrafsız&rdquo;</td>
            <td>&ldquo;2024&apos;te kombi + pencereler yenilendi&rdquo;</td>
            <td>Somut kanıt, boş sıfat değil</td>
          </tr>
          <tr>
            <td>Fiyat açıklamada gizli</td>
            <td>Fiyat alanında, net</td>
            <td>Fiyatsız ilan filtrelerde kaybolur</td>
          </tr>
        </tbody>
      </table>

      <h2>Dürüstlük SEO&apos;dan önce gelir</h2>
      <p>
        Brüt m²&apos;yi net gibi yazmak, kat bilgisini gizlemek, eski
        fotoğraf kullanmak tıklama getirir ama yer gösterimini yakar —
        alıcı kapıda hayal kırıklığıyla başlarsa pazarlık da güven de
        biter. Üstelik yanıltıcı ilan, Taşınmaz Ticareti Yönetmeliği&apos;ne
        göre yaptırım nedenidir. Kural: <strong>ilan, yer gösteriminde
        doğrulanacak bir vaattir.</strong>
      </p>

      <h2>Metin hazır — sıra görselde ve dağıtımda</h2>
      <p>
        En iyi metin bile kötü kapak fotoğrafını kurtaramaz; çekim
        standardı için{" "}
        <Link href="/blog/emlak-ilan-fotografciligi">
          ilan fotoğrafçılığı rehberine
        </Link>{" "}
        geçin. İlanı portala, ofis sitenize ve sosyal medyaya tek girişle
        dağıtmak içinse{" "}
        <Link href="/blog/toplu-emlak-ilani-yonetimi">
          toplu ilan yönetimi
        </Link>{" "}
        yazısındaki tek-kaynak düzenini kurun.
      </p>

      <h2>Sık sorulan sorular</h2>
      <h3>İlan açıklaması kaç kelime olmalı?</h3>
      <p>
        150-250 kelime idealdir: yaşam cümlesi kısa, teknik blok eksiksiz.
        Uzunluk değil eksiksizlik hedeflenir — alıcının telefonda soracağı
        sorunun cevabı ilanda olmalı.
      </p>
      <h3>Aynı ilanı her platforma aynı metinle mi girmeli?</h3>
      <p>
        Ana metin aynı kalır; ofis sitenizdeki versiyona ilan kodu ve talep
        formu eklenir. Ofis sitesinin ilan sayfası Google&apos;dan da trafik
        aldığı için oradaki başlık semt + tip aramasına göre yazılır.
      </p>
    </>
  );
}
