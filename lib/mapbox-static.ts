/** Mapbox Static Images API — 3D bina katmanlı yüksek çözünürlüklü statik harita URL'si. */

export type MapboxStaticImageOptions = {
  lat: number;
  lng: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  width?: number;
  height?: number;
  /** @2x retina — Veo için 1280×720 hedeflenir */
  retina?: boolean;
};

const DEFAULT_STYLE = "mapbox/satellite-streets-v12";

export function getMapboxAccessToken(): string {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Mapbox token tanımlı değil (MAPBOX_ACCESS_TOKEN veya NEXT_PUBLIC_MAPBOX_TOKEN).",
    );
  }
  return token;
}

/**
 * pitch=60 ve zoom=16 ile 3D bina/ arazi yapısını gösteren statik görüntü URL'si üretir.
 * Koordinat sırası Mapbox convention: lng,lat
 */
export function buildMapboxStaticImageUrl(
  opts: MapboxStaticImageOptions,
): string {
  const {
    lat,
    lng,
    zoom = 16,
    pitch = 60,
    bearing = 45,
    width = 1280,
    height = 720,
    retina = true,
  } = opts;

  const token = getMapboxAccessToken();
  const size = retina ? `${width}x${height}@2x` : `${width}x${height}`;
  const position = `${lng},${lat},${zoom},${bearing},${pitch}`;

  return `https://api.mapbox.com/styles/v1/${DEFAULT_STYLE}/static/${position}/${size}?access_token=${encodeURIComponent(token)}`;
}
