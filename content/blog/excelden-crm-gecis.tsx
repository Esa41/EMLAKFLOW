import Link from "next/link";

/** Cluster yazısı — hedef kelime: "emlak excel takip" (bkz. lib/blog.ts) */
export function ExceldenCrmGecisYazi() {
  return (
    <>
      <p>
        Türkiye&apos;deki emlak ofislerinin büyük bölümü portföyünü hâlâ
        Excel&apos;de (ya da bir deftere) tutuyor. Excel&apos;in cazibesi
        açık: ücretsiz, tanıdık ve esnek. Sorun şu ki emlak işi bir tablo
        değil, bir <strong>akış</strong> — ilan girer, alıcı sorar, yer
        gösterilir, pazarlık döner, tapu atılır. Bu akışı tabloda tutmanın
        maliyeti faturada görünmez ama her ay ödenir.
      </p>

      <h2>Excel&apos;in görünmez maliyetleri</h2>
      <ul>
        <li>
          <strong>Kaçan eşleşme:</strong> Yeni ilan girdiğinizde üç ay önce
          arayan alıcıyı hatırlamak size kalır. CRM&apos;de bu otomatik
          eşleşmedir; Excel&apos;de kayıp satıştır.
        </li>
        <li>
          <strong>Tek kopya riski:</strong> Dosya kimin bilgisayarında?
          Danışman ayrılınca liste onunla mı gidiyor? Ofisin en değerli
          varlığı bir masaüstü dosyasında yaşamamalı.
        </li>
        <li>
          <strong>Çift veri girişi:</strong> Aynı ilan portala ayrı, ofis
          sitesine ayrı, Excel&apos;e ayrı girilir. Üç kopyadan en az biri
          her zaman bayattır — ve çoğu zaman o bayat kopya müşterinin
          gördüğüdür.
        </li>
        <li>
          <strong>Geçmişsizlik:</strong> Hücre güncellenince eski fiyat, eski
          not, eski durum yok olur. &ldquo;Bu daireye kaç kişi baktı, neden
          satılmadı?&rdquo; sorusunun cevabı Excel&apos;de yoktur.
        </li>
      </ul>

      <h2>Geçişin 5 adımı</h2>
      <ol>
        <li>
          <strong>Tek doğru kaynağı ilan edin.</strong> Geçiş günü itibarıyla
          &ldquo;bir bilgi CRM&apos;de yoksa yok demektir&rdquo; kuralını
          koyun. Excel&apos;i paralel yaşatmak geçişlerin bir numaralı ölüm
          nedenidir.
        </li>
        <li>
          <strong>Excel&apos;inizi temizleyin.</strong> Satılmış/kiralanmış
          kayıtları arşive ayırın, telefonları tek biçime getirin
          (05xx xxx xx xx), mükerrer kişileri birleştirin. Kirli veri
          taşımak, kirli sistem kurmaktır.
        </li>
        <li>
          <strong>Önce aktif portföyü taşıyın.</strong> Tüm tarihçeyi değil,
          yayındaki ilanları ve son 6 ayın alıcı taleplerini aktarın.
          Gerisi arşiv olarak dursun.
        </li>
        <li>
          <strong>İlk haftayı birlikte çalışın.</strong> Her danışman kendi
          ilanlarını kendisi girsin — sahiplenme veri girişiyle başlar. Bir
          kişiyi &ldquo;CRM sorumlusu&rdquo; yapın; ilk ay soruların tek
          adresi o olsun.
        </li>
        <li>
          <strong>Bir akışı uçtan uca yaşayın.</strong> İlk hafta içinde bir
          ilanı girişten vitrine, bir talebi eşleşmeden yer göstermeye kadar
          sistem üzerinde yürütün. Ekip faydayı ilk satışta değil, ilk
          otomatik eşleşmede görür.
        </li>
      </ol>

      <h2>Taşıma kontrol listesi</h2>
      <table>
        <thead>
          <tr>
            <th>Veri</th>
            <th>Taşınacak mı?</th>
            <th>Not</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Aktif ilanlar</td>
            <td>Evet — 1. gün</td>
            <td>Fotoğraflar ve konumla birlikte</td>
          </tr>
          <tr>
            <td>Aktif alıcı talepleri</td>
            <td>Evet — 1. hafta</td>
            <td>Bütçe + bölge + oda sayısı zorunlu alan</td>
          </tr>
          <tr>
            <td>Kişi rehberi</td>
            <td>Evet</td>
            <td>Mükerrer kayıtları önce birleştirin</td>
          </tr>
          <tr>
            <td>Satılmış ilan arşivi</td>
            <td>Sonra</td>
            <td>Emsal analizi için değerli, acele değil</td>
          </tr>
          <tr>
            <td>Eski yazışmalar</td>
            <td>Hayır</td>
            <td>Yeni görüşmeler sistemde başlasın</td>
          </tr>
        </tbody>
      </table>

      <blockquote>
        Kural: geçiş bir hafta sonu işi değil, iki haftalık bir alışkanlık
        değişimidir. Yazılım kurulumu bir saat sürer; ekibin &ldquo;önce
        CRM&apos;e bak&rdquo; refleksi kazanması iki hafta.
      </blockquote>

      <p>
        Hangi kriterlerle CRM seçeceğinizi henüz netleştirmediyseniz önce{" "}
        <Link href="/blog/emlak-crm">
          emlak CRM seçim rehberini
        </Link>{" "}
        okuyun; oradaki karşılaştırma tablosu bu geçiş planıyla birlikte
        çalışacak şekilde hazırlandı.
      </p>
    </>
  );
}
