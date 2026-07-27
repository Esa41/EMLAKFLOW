/**
 * Mapbox stil URL — Studio'da özel stil yayınlayınca env ile override edilir.
 *
 * Harita ORİJİNAL STANDART Mapbox şablonuyla çizilir; üzerine marka teması
 * basılmaz. Eskiden `applyEmlakflowMapTheme` / `tintMutedLayers` ile zemin,
 * su, park, bina ve yol katmanları adaçayı yeşiline boyanıyordu; monokrom
 * kimlikle birlikte kaldırıldı. Gerekçe: harita bir İÇERİK yüzeyidir —
 * rengi kendi taşır, arayüz onu boyamaz. Özel bir görünüm istenirse doğru
 * yer Mapbox Studio'da stil yayınlayıp NEXT_PUBLIC_MAPBOX_STYLE ile
 * bağlamaktır; runtime'da katman katman boyamak sürüm değişiminde kırılır.
 */
export function getMapboxStyleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    "mapbox://styles/mapbox/streets-v12"
  );
}
