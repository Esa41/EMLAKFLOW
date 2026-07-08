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
    map.setPaintProperty(
      layerId,
      property as Parameters<mapboxgl.Map["setPaintProperty"]>[1],
      value as Parameters<mapboxgl.Map["setPaintProperty"]>[2],
    );
  } catch {
    /* katman bu stilde farklı olabilir */
  }
}

/**
 * streets-v12 / light-v11 üzerine PARSEL vitrin teması.
 * Mapbox Studio'da ayrı stil yayınlamadan marka görünümü verir.
 */
/**
 * applyEmlakflowMapTheme'in kaçırdığı yol/park katmanlarını da adaçayına çeker
 * (streets-v12 katman adları sürüme göre değişebildiği için regex ile).
 */
export function tintMutedLayers(map: mapboxgl.Map) {
  for (const layer of map.getStyle()?.layers ?? []) {
    try {
      if (layer.type === "line" && /road|bridge|tunnel|street/.test(layer.id)) {
        map.setPaintProperty(
          layer.id,
          "line-color",
          /motorway|trunk/.test(layer.id) ? "#97ab9d" : "#bcc7bf",
        );
      } else if (
        layer.type === "fill" &&
        /landuse|park|pitch|grass|wood|scrub/.test(layer.id)
      ) {
        map.setPaintProperty(layer.id, "fill-color", "#dfe7df");
      }
    } catch {
      /* katman bu stilde farklı olabilir */
    }
  }
}

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
