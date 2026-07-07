/** Saf CSS ürün önizlemeleri — landing'de gerçek ekran görüntüsü yerine */

export function HeroProductMockup() {
  return (
    <div className="landing-mockup-shell relative mx-auto w-full max-w-4xl">
      <div className="landing-glow-orb landing-glow-orb-a" aria-hidden />
      <div className="landing-glow-orb landing-glow-orb-b" aria-hidden />

      <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_32px_80px_-20px_rgba(23,32,28,0.35)] ring-1 ring-ink/5">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-ink/8 bg-paper/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center rounded-md bg-white px-3 font-mono text-[10px] text-ink/45">
            emlakflow.com/ofis/atlas-gayrimenkul
          </div>
        </div>

        <div className="grid min-h-[280px] grid-cols-[140px_1fr] sm:min-h-[340px] sm:grid-cols-[180px_1fr]">
          {/* Sidebar */}
          <div className="hidden border-r border-ink/8 bg-brand-50/40 p-3 sm:block">
            <div className="mb-4 font-display text-sm font-extrabold">
              Emlak<span className="text-brand-600">Flow</span>
            </div>
            {["Bugün", "Portföy", "Satış Hattı", "Kasa"].map((item, i) => (
              <div
                key={item}
                className={`mb-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                  i === 0 ? "bg-brand-600 text-white" : "text-ink/55"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Map area */}
          <div className="relative overflow-hidden bg-[#e8ede5]">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(30,91,62,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,91,62,0.08) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-100/30 via-transparent to-copper/10" />

            {/* Price pins */}
            <div className="fiyat-pin landing-float-a absolute left-[18%] top-[22%] text-[10px]">
              ₺4.2M
            </div>
            <div className="fiyat-pin fiyat-pin-kira landing-float-b absolute left-[52%] top-[38%] text-[10px]">
              ₺28K/ay
            </div>
            <div className="fiyat-pin landing-float-c absolute right-[12%] top-[18%] text-[10px]">
              ₺2.8M
            </div>
            <div className="fiyat-pin landing-float-a absolute bottom-[28%] left-[35%] text-[10px]">
              ₺6.5M
            </div>

            {/* Lead notification */}
            <div className="landing-float-b absolute bottom-4 right-4 max-w-[200px] rounded-xl border border-ink/10 bg-white p-3 shadow-lg">
              <p className="font-mono text-[9px] uppercase tracking-wider text-brand-600">
                Yeni lead
              </p>
              <p className="mt-1 text-xs font-semibold text-ink">Ayşe Y. — 3+1 arıyor</p>
              <p className="mt-0.5 text-[10px] text-ink/50">Vitrin formu · az önce</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat cards */}
      <div className="landing-float-c absolute -left-2 top-8 hidden rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-xl sm:block lg:-left-8">
        <p className="font-mono text-[9px] uppercase tracking-wider text-ink/40">Eşleşme</p>
        <p className="font-display text-2xl font-extrabold text-brand-600">94</p>
        <p className="text-[10px] text-ink/50">3+1 talep ↔ yeni ilan</p>
      </div>
      <div className="landing-float-a absolute -right-2 bottom-12 hidden rounded-xl border border-ink/10 bg-ink px-4 py-3 text-white shadow-xl sm:block lg:-right-6">
        <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">Komisyon</p>
        <p className="font-display text-xl font-extrabold">₺145.000</p>
        <p className="text-[10px] text-white/60">Otomatik hesaplandı</p>
      </div>
    </div>
  );
}

export function KanbanMockup() {
  const cols = [
    { title: "Yeni", cards: 2, accent: false },
    { title: "Yer Gösterildi", cards: 1, accent: true },
    { title: "Teklif", cards: 1, accent: false },
  ];
  return (
    <div className="flex gap-2.5 p-1 sm:gap-3">
      {cols.map((col) => (
        <div key={col.title} className="min-w-0 flex-1 rounded-xl bg-ink/5 p-2 sm:p-2.5">
          <p className="mb-2 truncate font-mono text-[9px] font-semibold uppercase tracking-wider text-ink/45">
            {col.title}
          </p>
          {Array.from({ length: col.cards }).map((_, i) => (
            <div
              key={i}
              className={`mb-2 rounded-lg border p-2.5 shadow-sm ${
                col.accent && i === 0
                  ? "border-brand-500/30 bg-brand-50 ring-2 ring-brand-500/20"
                  : "border-ink/8 bg-white"
              }`}
            >
              <div className="h-1.5 w-2/3 rounded bg-ink/15" />
              <div className="mt-2 h-1 w-1/2 rounded bg-ink/10" />
              {col.accent && i === 0 && (
                <p className="mt-2 text-[10px] font-semibold text-brand-700">₺3.2M · İzmit</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function MatchMockup() {
  return (
    <div className="space-y-2">
      {[
        { name: "Mehmet K.", score: 94, reason: "Bütçe + semt + oda sayısı" },
        { name: "Selin A.", score: 87, reason: "Kartepe · 3+1 · max 4.5M" },
        { name: "Can D.", score: 76, reason: "Deniz manzarası tercihi" },
      ].map((m) => (
        <div
          key={m.name}
          className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white p-3 shadow-sm"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${
              m.score >= 90 ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-700"
            }`}
          >
            {m.score}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{m.name}</p>
            <p className="truncate text-[11px] text-ink/50">{m.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PortalMockup() {
  const portals = ["Sahibinden", "Hepsiemlak", "Emlakjet"];
  return (
    <div className="rounded-xl border border-ink/10 bg-ink p-4 text-white">
      <p className="font-mono text-[9px] uppercase tracking-wider text-white/45">XML Feed</p>
      <p className="mt-1 truncate font-mono text-[11px] text-brand-100">
        /api/feed/••••••.xml
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {portals.map((p) => (
          <span
            key={p}
            className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium"
          >
            {p} ✓
          </span>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-white/50">Tek kaynak — tüm portallar senkron</p>
    </div>
  );
}

export function ChatMockup() {
  return (
    <div className="space-y-2.5">
      <div className="ml-6 rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-[11px] text-white">
        Merhaba, Başiskele&apos;deki 3+1 hâlâ müsait mi?
      </div>
      <div className="mr-6 rounded-2xl rounded-tl-sm border border-ink/10 bg-white px-3 py-2 text-[11px] text-ink shadow-sm">
        Evet! Yarın 14:00 yer gösterimi yapabilirim 🏠
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
        </span>
        <span className="text-[10px] font-medium text-brand-700">Vitrin sohbeti · CRM&apos;e düştü</span>
      </div>
    </div>
  );
}
