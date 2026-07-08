import Link from "next/link";

/** Cluster yazısı — hedef: "emlakçılıkta portföy nasıl toplanır" */
export function PortfoyNasilToplanirYazi() {
  return (
    <>
      <p>
        Emlakçılıkta en sık duyulan yakınma aynıdır: &ldquo;Alıcı çok,
        portföy yok.&rdquo; Satılık daire bulmak, alıcı bulmaktan zordur —
        çünkü mülk sahibi size gelmez, siz onu bulursunuz. Aşağıdaki 7
        yöntem, bölgesinde sıfırdan portföy kuran ofislerin fiilen
        kullandığı taktiklerdir; her birinin yanında beklenen efor ve
        getiri hızı var.
      </p>

      <h2>1. Bölge hakimiyeti: 500 kapı kuralı</h2>
      <p>
        Tüm şehre değil, yürüyerek 20 dakikada dolaşabileceğiniz bir bölgeye
        odaklanın: 15-20 apartman, ~500 kapı. Kapıcılar, site yöneticileri ve
        köşedeki esnaf, kimin taşınacağını ilan çıkmadan haftalar önce bilir.
        Haftada iki sabah bu turu atan danışman, üç ay içinde bölgenin
        &ldquo;önce ona sorulan&rdquo; ismi olur. En yavaş ama en sağlam
        yöntem budur.
      </p>

      <h2>2. Sahibinden satılık ilanları arayın — doğru cümleyle</h2>
      <p>
        Portallardaki &ldquo;sahibinden&rdquo; ilanları herkes arar; fark
        cümlededir. &ldquo;İlanınızı alabilir miyim?&rdquo; değil:
        &ldquo;Bu daireye uyan iki kayıtlı alıcım var, yer gösterme
        koşullarını konuşabilir miyiz?&rdquo; Bunu dürüstçe söyleyebilmek
        için önce alıcı taleplerinizin kayıtlı olması gerekir — talep
        havuzu olmayan ofis bu cümleyi kuramaz.
      </p>

      <h2>3. Satılan her mülkün çevresine dokunun</h2>
      <p>
        Bir satış kapandığında o sokakta 30 kapıya kısa bir not bırakın:
        &ldquo;X apartmanında 3+1 daireyi Y günde sattık. Değerleme isterseniz
        ücretsiz bakarız.&rdquo; Satış kanıttır; kanıt portföy getirir.
        Aynı bilgiyi ofis vitrininizde &ldquo;son satılanlar&rdquo; olarak
        yayınlamak bu etkiyi kalıcılaştırır.
      </p>

      <h2>4. Ücretsiz değerleme günü</h2>
      <p>
        Ayda bir cumartesi, &ldquo;mülkünüzün güncel değerini öğrenin&rdquo;
        etkinliği duyurun (mahalle grupları + kapı notu + Instagram).
        Değerleme isteyenlerin üçte biri 12 ay içinde satıcıdır. Emsal
        verinizi düzenli tutuyorsanız değerleme 15 dakikanızı alır, karşılığı
        bir portföy görüşmesidir.
      </p>

      <h2>5. Kira yönetiminden satışa köprü</h2>
      <p>
        Kirasını yönettiğiniz her mülk, gelecekteki bir satış vekaletidir.
        Mülk sahibi satmaya karar verdiğinde kiminle çalışır? Kirayı düzenli
        toplayan, sorunları çözen ofisle. Kira takibini profesyonel yürütmek
        (otomatik hatırlatma, dijital makbuz) bu köprünün temelidir.
      </p>

      <h2>6. Eski müşteri = yeni portföy</h2>
      <p>
        Üç yıl önce daire sattığınız alıcı bugünün potansiyel satıcısıdır.
        Yılda iki kez arayın: bir kez bayramda, bir kez &ldquo;bölgenizde
        fiyatlar %X arttı, isterseniz güncel değerleme çıkarayım&rdquo;
        diye. Bunu hafızayla değil, sistemle yapın — müşteri kaydına
        hatırlatma koyamıyorsanız bu kanal çalışmaz.
      </p>

      <h2>7. Dijital vitrin: gece de çalışan danışman</h2>
      <p>
        Mülk sahibi sizi araştırır: adınızı Google&apos;a yazar, portföyünüze
        bakar. Derli toplu bir ofis vitrini — güncel ilanlar, harita,
        satılanlar, müşteri talep formu — &ldquo;bu ofis işini biliyor&rdquo;
        izlenimini kapı ziyaretinden önce oluşturur. Vitrinden gelen her
        talep formu da kayıtlı bir alıcıdır; 2. yöntemdeki cümlenin
        cephanesi buradan dolar.
      </p>

      <h2>Hangi yöntemle başlamalı?</h2>
      <table>
        <thead>
          <tr>
            <th>Yöntem</th>
            <th>Efor</th>
            <th>İlk sonuç</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1. Bölge hakimiyeti</td><td>Yüksek</td><td>2-3 ay</td></tr>
          <tr><td>2. Sahibinden araması</td><td>Orta</td><td>1-2 hafta</td></tr>
          <tr><td>3. Satış çevresi</td><td>Düşük</td><td>İlk satışta</td></tr>
          <tr><td>4. Değerleme günü</td><td>Orta</td><td>1 ay</td></tr>
          <tr><td>5. Kira köprüsü</td><td>Orta</td><td>6+ ay</td></tr>
          <tr><td>6. Eski müşteri</td><td>Düşük</td><td>1-3 ay</td></tr>
          <tr><td>7. Dijital vitrin</td><td>Düşük</td><td>Sürekli</td></tr>
        </tbody>
      </table>
      <p>
        Yeni başlayan ofis için önerilen karışım: <strong>2 + 3 + 7</strong>{" "}
        hemen (düşük efor, hızlı sonuç), <strong>1</strong> paralelde uzun
        vade için. İlk 30 günde hedef: 10 portföy görüşmesi, 5 yetkili ilan.
      </p>
      <p>
        Toplanan portföy ve alıcı taleplerini kayıt altında tutmak bu işin
        görünmeyen yarısıdır —{" "}
        <Link href="/blog/emlak-crm">emlak CRM rehberinde</Link> eşleştirme
        sisteminin nasıl çalıştığını anlattık. Ofisi yeni kuruyorsanız önce{" "}
        <Link href="/blog/emlak-ofisi-acmak">kuruluş rehberine</Link> göz
        atın.
      </p>
    </>
  );
}
