import Link from "next/link";

/** Cluster yazısı — hedef: "emlak ilan fotoğrafı" (bkz. lib/blog.ts) */
export function EmlakIlanFotografciligiYazi() {
  return (
    <>
      <p>
        Portalda alıcının başlığa bakmadan önce gördüğü tek şey kapak
        fotoğrafıdır; karanlık, dikey, dağınık bir kare ilanınızı daha
        yarışa girmeden eler. İyi haber: profesyonel görünen ilan
        fotoğrafı için profesyonel ekipman gerekmez — son üç yılın
        herhangi bir telefonu ve bu rehberdeki disiplin yeter.
      </p>

      <h2>Çekimden önce: 20 dakikalık hazırlık</h2>
      <p>
        İyi fotoğrafın %70&apos;i çekimden önce biter. Mülk sahibiyle çekim
        saatini belirlerken şu listeyi paylaşın:
      </p>
      <ul>
        <li>Tezgahlar ve masalar boş — sünger, deterjan, şarj kablosu kadraja
          girmesin</li>
        <li>Yataklar yapılmış, kişisel fotoğraflar ve çamaşır askısı kaldırılmış</li>
        <li>Tüm perdeler açık, <strong>tüm lambalar yanık</strong> (gündüz bile —
          sarı-beyaz denge derinlik verir)</li>
        <li>Klozet kapakları kapalı, banyoda havlu düzeni</li>
        <li>Balkon/teras toplanmış — çoğu dairenin en satan karesi orasıdır</li>
      </ul>

      <h2>Işık: günün doğru saati</h2>
      <p>
        Cepheye göre saat seçin: güneydoğu cephe sabah 09-11, güneybatı
        öğleden sonra 14-16 arası en iyi ışığı alır. Pencereye karşı değil,
        pencere yanınızdayken çekin — cam beyaz patlamaz, oda aydınlık
        çıkar. Manzara karesi için (deniz/orman/silüet) gün batımına yakın
        &ldquo;altın saat&rdquo; ayrı bir tur hak eder.
      </p>

      <h2>Telefon ayarları ve açı kuralları</h2>
      <ol>
        <li><strong>Yatay çekin.</strong> Portal vitrini yataydır; dikey kare
          kapakta kırpılır.</li>
        <li><strong>Göğüs hizasından</strong> (~120-130 cm) çekin — göz
          hizası tavanı, bel altı zemini şişirir.</li>
        <li><strong>Geniş açıyı (0.5x) abartmayın:</strong> köşe odalarda
          kurtarıcıdır ama her karede kullanılırsa daire yer gösteriminde
          &ldquo;fotoğraftakinden küçük&rdquo; hissi verir — güven kaybı.</li>
        <li><strong>Köşeden çekin,</strong> iki duvar görünsün — derinlik
          algısı köşeden gelir.</li>
        <li>Izgara (grid) açık: düşey çizgiler dik olsun; yamuk duvar,
          özensiz ofis demektir.</li>
        <li>HDR açık, flaş kapalı.</li>
      </ol>

      <h2>Oda oda çekim listesi</h2>
      <table>
        <thead>
          <tr>
            <th>Mekan</th>
            <th>Kare sayısı</th>
            <th>Not</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Salon</td><td>3-4</td><td>Kapak adayı; iki köşeden + balkon kapısına doğru</td></tr>
          <tr><td>Mutfak</td><td>2-3</td><td>Tezgah boş; ankastre görünsün</td></tr>
          <tr><td>Yatak odaları</td><td>2&apos;şer</td><td>Kapı köşesinden + pencereye doğru</td></tr>
          <tr><td>Banyo</td><td>1-2</td><td>Ayna yansımasına dikkat — siz kadrajda olmayın</td></tr>
          <tr><td>Balkon/manzara</td><td>2-3</td><td>Manzara + balkonun kendisi ayrı kareler</td></tr>
          <tr><td>Bina/çevre</td><td>2-3</td><td>Giriş, cephe, otopark; site ise sosyal alanlar</td></tr>
        </tbody>
      </table>
      <p>
        Toplam hedef: <strong>yayında 12-18 kare.</strong> 40 karelik albüm
        değil, her karesi bilgi taşıyan bir seçki — aynı odanın dört benzer
        karesi ilanı zenginleştirmez, sulandırır.
      </p>

      <h2>Sıralama: kapak karesi stratejisi</h2>
      <p>
        İlk üç fotoğraf tıklamayı belirler: <strong>1)</strong> en güçlü kare
        (manzaralı salon ya da en aydınlık oda), <strong>2)</strong> ikinci
        en iyi yaşam alanı, <strong>3)</strong> mutfak. Bina cephesi ve
        tapu-kroki kareleri sona. Fotoğraf sırası, panelinizde
        sürükle-bırakla yönetilebilmeli — her platformda ayrı ayrı
        sıralamak, <Link href="/blog/toplu-emlak-ilani-yonetimi">toplu
        ilan yönetimi</Link> rehberindeki çift-emek tuzağının ta kendisidir.
      </p>

      <h2>Üç yaygın hata</h2>
      <ul>
        <li><strong>Aynada/camda fotoğrafçı:</strong> banyo ve vitrin
          karelerinde yansımanızı kontrol edin.</li>
        <li><strong>Mevsim yalanı:</strong> karlı bahçe fotoğrafıyla yazın
          yayında olan ilan, &ldquo;bu ilan kaç aydır satılmıyor?&rdquo;
          sorusunu davet eder. Fotoğraflar 6 aydan eskiyse tazeleyin.</li>
        <li><strong>Filtre/aşırı düzenleme:</strong> parlaklık-kontrast
          düzeltmesi evet, gökyüzü değiştirme hayır — ilan, yer gösteriminde
          doğrulanacak bir vaattir (bkz.{" "}
          <Link href="/blog/emlak-ilani-nasil-yazilir">
            ilan yazma rehberi
          </Link>
          ).</li>
      </ul>

      <h2>Sık sorulan sorular</h2>
      <h3>Drone çekimi değer mi?</h3>
      <p>
        Müstakil, arsa ve site projelerinde evet — konum ve çevre tek karede
        anlatılır. Standart daire ilanında önce temel listeyi eksiksiz yapın;
        drone, vitrinin süsüdür, temeli değil.
      </p>
      <h3>Fotoğraflara logo/filigran eklemeli mi?</h3>
      <p>
        Köşede küçük ve yarı saydam olmak şartıyla evet — portaldan kopyalanan
        fotoğraflar markanızı taşır. Kadrajın ortasına damga vurmak ise
        alıcıyı da karayı da rahatsız eder.
      </p>
    </>
  );
}
