const ITEMS = [
  "AI tanıtım videosu",
  "8 hazır kurgu şablonu",
  "Seslendirme + altyazı",
  "FPV ev turu",
  "Arsa drone videosu",
  "Instagram Reels",
  "Harita vitrini",
  "Akıllı eşleştirme",
  "Portal entegrasyonu",
  "Ücretsiz CRM",
  "Tek tık sözleşme",
  "Canlı analitik",
];

export function FeatureMarquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="landing-marquee-wrap border-y border-ink/8 bg-white py-4">
      <div className="landing-marquee-track flex gap-3">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="shrink-0 rounded-full border border-ink/10 bg-paper px-4 py-1.5 text-sm font-medium text-ink/70"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
