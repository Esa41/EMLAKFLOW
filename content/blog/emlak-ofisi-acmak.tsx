import Link from "next/link";

/** Pillar 1 ana yazısı — hedef kelime: "emlak ofisi nasıl açılır" */
export function EmlakOfisiAcmakYazi() {
  return (
    <>
      <p>
        Emlak ofisi açmak 2026&apos;da iki ayrı işi aynı anda kurmak
        demektir: mevzuatı tamam bir <strong>işletme</strong> ve bölgesinde
        güven kazanan bir <strong>marka</strong>. Bu rehber ikisini tek yol
        haritasında birleştirir: belgeler, maliyet kalemleri ve açılış
        sonrası ilk adımlar.
      </p>

      <h2>1. Yasal zemin: Taşınmaz Ticareti Yetki Belgesi</h2>
      <p>
        Türkiye&apos;de emlak aracılığı yapmak için{" "}
        <strong>Taşınmaz Ticareti Yetki Belgesi</strong> zorunludur
        (Taşınmaz Ticareti Hakkında Yönetmelik). Özet gereksinimler:
      </p>
      <ul>
        <li>
          <strong>Mesleki yeterlilik:</strong> Sorumlu emlak danışmanı
          (Seviye 5) belgesi — MYK onaylı sınavla alınır.
        </li>
        <li>
          <strong>Eğitim şartı:</strong> En az lise mezuniyeti + il
          müdürlüğünce kabul edilen taşınmaz ticareti eğitimi.
        </li>
        <li>
          <strong>Fiziki ofis:</strong> Bağımsız bölüm niteliğinde,
          net 30 m² üzeri bir işyeri (paylaşımlı/home-office kabul edilmez).
        </li>
        <li>
          <strong>Sabıka ve vergi kaydı:</strong> Belirli suçlardan hüküm
          giymemiş olmak; gerçek ya da tüzel kişi vergi mükellefiyeti.
        </li>
      </ul>
      <p>
        Başvuru, Ticaret Bakanlığı&apos;nın Taşınmaz Ticareti Bilgi Sistemi
        (TTBS) üzerinden yapılır. Belgesiz faaliyet hem idari para cezasına
        hem de komisyon alacağının yasal korumasız kalmasına yol açar —
        kestirme yoktur.
      </p>

      <h2>2. Şirket mi şahıs mı?</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Şahıs işletmesi</th>
            <th>Limited şirket</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kuruluş hızı/maliyeti</td>
            <td>Hızlı, düşük</td>
            <td>Noter + sicil masraflı</td>
          </tr>
          <tr>
            <td>Vergi</td>
            <td>Artan oranlı gelir vergisi</td>
            <td>Sabit kurumlar vergisi</td>
          </tr>
          <tr>
            <td>Sorumluluk</td>
            <td>Tüm şahsi malvarlığı</td>
            <td>Sermaye ile sınırlı</td>
          </tr>
          <tr>
            <td>Kime uygun?</td>
            <td>Tek başına başlayan danışman</td>
            <td>Ekipli / franchise hedefleyen ofis</td>
          </tr>
        </tbody>
      </table>
      <p>
        Yaygın pratik: tek başına başlıyorsanız şahıs işletmesiyle açılıp
        ciro büyüyünce limitede dönmek. Kararı mali müşavirinizle, ilk yıl
        ciro beklentinize göre verin.
      </p>

      <h2>3. Maliyet kalemleri (2026)</h2>
      <p>
        Rakamlar şehre ve semte göre büyük oynar; bu yüzden tutar değil
        kalem listesi verelim — bütçenizi bu tabloyla kurun:
      </p>
      <ul>
        <li>Ofis: depozito + 3 aylık kira rezervi + tabela ve tefriş</li>
        <li>Belgeler: yeterlilik sınavı, eğitim, TTBS başvuru giderleri</li>
        <li>Kuruluş: mali müşavir, vergi levhası, oda kaydı</li>
        <li>Pazarlama: web sitesi/vitrin, portal üyelikleri, baskı işleri</li>
        <li>İşletme sermayesi: <strong>6 aylık sabit gider</strong> — ilk
          komisyonun 3-4 ay gecikebileceğini varsayın</li>
      </ul>
      <blockquote>
        En sık yapılan hata: bütçenin tamamını açılışa harcayıp işletme
        sermayesiz kalmak. İlk tapu gelmeden ofis kirası üç kez ödenir.
      </blockquote>

      <h2>4. Açılış sonrası ilk 30 gün</h2>
      <ol>
        <li>
          <strong>Bölge seçin ve daraltın:</strong> tüm ilçe değil, ~500
          kapılık bir alan. Neden ve nasıl:{" "}
          <Link href="/blog/portfoy-nasil-toplanir">
            portföy toplama rehberi
          </Link>
          .
        </li>
        <li>
          <strong>Dijital varlığı ilk hafta kurun:</strong> Google İşletme
          Profili + ofis vitrini/web sitesi. Mülk sahibi sizi kapınızdan önce
          Google&apos;da görür.
        </li>
        <li>
          <strong>Kayıt sistemini ilk günden kurun:</strong> portföy ve
          alıcı talebini defterde değil sistemde tutun — hangi araçla ve
          hangi kriterle:{" "}
          <Link href="/blog/emlak-crm">emlak CRM seçim rehberi</Link>.
          10 ilana ulaştıktan sonra geçmek, baştan kurmaktan üç kat
          zahmetlidir.
        </li>
        <li>
          <strong>İlk 10 portföy görüşmesini planlayın:</strong> günde bir
          görüşme, ilk ayda 5 yetkili ilan gerçekçi hedeftir.
        </li>
      </ol>

      <h2>Sık sorulan sorular</h2>
      <h3>Franchise mı bağımsız mı açmalı?</h3>
      <p>
        Franchise marka ve eğitim getirir, ciro payı ve giriş bedeli alır;
        bağımsız ofis marjı korur, güveni sıfırdan kurar. Bölgenizde güçlü
        bir ağınız varsa bağımsızlık, sektöre dışarıdan giriyorsanız
        franchise genelde daha güvenli ilk adımdır.
      </p>
      <h3>Ev ofisten emlakçılık yapılır mı?</h3>
      <p>
        Hayır — yönetmelik bağımsız bölüm niteliğinde fiziki ofis şartı
        arar; ikamet adresiyle yetki belgesi alınamaz.
      </p>
      <h3>Yanımda danışman çalıştırmak için ne gerekir?</h3>
      <p>
        Ofiste çalışan her danışmanın en az Seviye 4 (emlak danışmanı)
        mesleki yeterlilik belgesi olmalıdır. Komisyon paylaşım modelini
        (yüzde/kademe) yazılı sözleşmeye bağlayın — ay sonu anlaşmazlıkların
        tek panzehiri budur.
      </p>
    </>
  );
}
