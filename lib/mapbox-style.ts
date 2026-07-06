import type mapboxgl from "mapbox-gl";

/** Mapbox stil URL — Studio'da özel stil yayınlayınca env ile override edilir. */
export function getMapboxStyleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    "mapbox://styles/mapbox/streets-v12"
  );
}

function safePaint(
  map: mapboxgl.Map,
  layerId: string,
  property: string,
  value: unknown,
) {
  if (!map.getLayer(layerId)) return;
  try {
    map.setPaintProperty(layerId, property, value);
  } catch {
    /* katman bu stilde farklı olabilir */
  }
}

/**
 * streets-v12 / light-v11 üzerine PARSEL vitrin teması.
 * Mapbox Studio'da ayrı stil yayınlamadan marka görünümü verir.
 */
export function applyEmlakflowMapTheme(map: mapboxgl.Map) {
  // Zemin — paper tonu
  safePaint(map, "background", "background-color", "#eff1ec");
  safePaint(map, "land", "background-color", "#e8ebe4");

  // Su — yumuşak adaçayı-yeşil
  safePaint(map, "water", "fill-color", "#c8ddd4");
  safePaint(map, "waterway", "line-color", "#a8c4b8");

  // Yeşil alanlar — brand ailesi
  safePaint(map, "national-park", "fill-color", "#d6e4d9");
  safePaint(map, "landuse", "fill-color", "#e4ebe6");

  // Binalar — hafif, 3D browse modunda
  safePaint(map, "building", "fill-color", "#d8ddd6");
  safePaint(map, "building", "fill-opacity", 0.5);

  // Yollar — mürekkep-gri, ana arterler biraz daha belirgin
  const roadLayers = [
    "road-motorway",
    "road-trunk",
    "road-primary",
    "road-secondary",
    "road-street",
    "road-street-low",
  ];
  for (const id of roadLayers) {
    safePaint(map, id, "line-color", "#b8c4bc");
  }
  safePaint(map, "road-motorway", "line-color", "#8fa898");
  safePaint(map, "road-primary", "line-color", "#9aada0");

  // Etiket kontrastı — POI biraz soluk (ilan pinleri öne çıksın)
  const labelLayers = map
    .getStyle()
    .layers?.filter((l) => l.type === "symbol" && l.id.includes("label"))
    .map((l) => l.id);

  for (const id of labelLayers ?? []) {
    safePaint(map, id, "text-opacity", 0.72);
  }
}
