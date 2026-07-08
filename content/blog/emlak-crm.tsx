import Link from "next/link";

/** Pillar 4 ana yazısı — hedef kelime: "emlak crm" (bkz. lib/blog.ts) */
export function EmlakCrmYazi() {
  return (
    <>
      <p>
        <strong>Emlak CRM</strong>, bir emlak ofisinin üç dağınık listesini —
        portföy, müşteri ve görüşme geçmişi — tek bir sistemde birleştiren
        yazılımdır. Doğru kurulduğunda &ldquo;o daireyi soran bey kimdi?&rdquo;
        sorusu ortadan kalkar: hangi alıcının neye baktığı, hangi ilanın kaç
        kez gösterildiği ve hangi danışmanın hangi aşamada olduğu tek ekranda
        görünür.
      </p>
      <p>
        Bu rehberde CRM&apos;in bir emlak ofisinde tam olarak neyi çözdüğünü,
        seçerken hangi kriterlere bakmanız gerektiğini ve yaygın hataları
        adım adım ele alıyoruz.
      </p>

      <h2>Emlak CRM ne işe yarar?</h2>
      <p>
        Genel amaçlı CRM&apos;lerden (satış ekipleri için yapılmış araçlardan)
        farklı olarak emlak CRM&apos;i, sektörün üç özel ihtiyacını birden
        karşılamak zorundadır:
      </p>
      <ul>
        <li>
          <strong>Portföy takibi:</strong> Her ilanın fotoğrafları, tapu ve
          konum bilgisi, fiyat geçmişi ve yayın durumu tek kayıtta durur.
          İlan portala, vitrine ve sosyal medyaya aynı kayıttan beslenir.
        </li>
        <li>
          <strong>Alıcı-portföy eşleştirme:</strong> &ldquo;Kadıköy&apos;de
          3+1, 15 milyona kadar&rdquo; diyen alıcı sisteme girildiğinde,
          uyan yeni ilan portföye eklendiği an eşleşme düşer. Excel&apos;de
          bu işi hafızanız yapar — ve hafıza satış kaçırır.
        </li>
        <li>
          <strong>Satış hattı (pipeline):</strong> Görüşme → yer gösterme →
          pazarlık → kaparo → tapu aşamaları kanban panosunda ilerler; hangi
          fırsatın nerede tıkandığı görünür olur.
        </li>
      </ul>

      <h2>Seçim kriterleri: neye bakmalı?</h2>
      <table>
        <thead>
          <tr>
            <th>Kriter</th>
            <th>Neden kritik?</th>
            <th>Kontrol sorusu</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Türkçe ve yerel akış</td>
            <td>Kaparo, emsal, yetki belgesi gibi kavramlar yurt dışı
              araçlarda yok</td>
            <td>Sözleşme ve komisyon akışı Türkiye pratiğine uygun mu?</td>
          </tr>
          <tr>
            <td>Vitrin / web sitesi</td>
            <td>Portföy ayrı bir siteye elle kopyalanmamalı</td>
            <td>İlan girince ofis siteme otomatik düşüyor mu?</td>
          </tr>
          <tr>
            <td>Komisyon paylaşımı</td>
            <td>Ekipli ofiste ay sonu hesap kavgası en büyük zaman kaybıdır</td>
            <td>Danışman payları otomatik hesaplanıyor mu?</td>
          </tr>
          <tr>
            <td>Mobil kullanım</td>
            <td>Danışman günün çoğunu sahada geçirir</td>
            <td>Yer gösterme sonrası not telefondan giriliyor mu?</td>
          </tr>
          <tr>
            <td>Veri sahipliği</td>
            <td>Portföy ve müşteri listesi ofisin en değerli varlığıdır</td>
            <td>İstediğimde verimi dışa aktarabiliyor muyum?</td>
          </tr>
        </tbody>
      </table>

      <h2>Yaygın 3 hata</h2>
      <ol>
        <li>
          <strong>Aracı ekibe anlatmadan almak.</strong> CRM, danışmanlar veri
          girerse çalışır. İlk hafta birlikte kurulum yapın; ilk eşleşme
          satışa dönünce ikna kendiliğinden gelir.
        </li>
        <li>
          <strong>Excel&apos;i paralel yaşatmak.</strong> İki sistem aynı anda
          yaşarsa ikisi de eksik kalır. Geçiş planı için{" "}
          <Link href="/blog/excelden-crm-gecis">
            Excel&apos;den CRM&apos;e geçiş rehberine
          </Link>{" "}
          bakın.
        </li>
        <li>
          <strong>Sadece ilan deposu gibi kullanmak.</strong> Alıcı talepleri
          girilmiyorsa eşleştirme çalışmaz; CRM&apos;in satış getiren yarısı
          kapalı kalır. Talep toplamayı kolaylaştırmak için{" "}
          <Link href="/blog/portfoy-nasil-toplanir">
            portföy toplama yöntemleri
          </Link>{" "}
          yazısındaki vitrin taktiği ile birleştirin.
        </li>
      </ol>

      <h2>Sık sorulan sorular</h2>
      <h3>Küçük ofise (1-3 danışman) CRM gerekir mi?</h3>
      <p>
        Portföyünüz 20 ilanı, aktif alıcınız 15 kişiyi geçtiyse evet. Bu
        eşikten sonra hafıza ve WhatsApp aramasıyla takip, ayda en az bir
        fırsatın sessizce kaybolması demektir.
      </p>
      <h3>Emlak CRM fiyatları ne kadar?</h3>
      <p>
        Türkiye pazarında danışman başına aylık abonelik modeli yaygındır;
        giriş planları çoğunlukla ücretsizdir. Toplam maliyeti yazılım ücreti
        değil, geçiş disiplini belirler — bkz. yukarıdaki 2. hata.
      </p>
      <h3>Verilerimi taşıyabilir miyim?</h3>
      <p>
        İyi bir CRM, Excel/CSV içe aktarma sunar. Satın almadan önce mutlaka
        deneme hesabında kendi listenizle test edin.
      </p>
    </>
  );
}
