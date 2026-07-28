"""EMLAKFLOW — Ana orkestrasyon pipeline'ı.

Tüm katmanları bağlar:
  Layer1 (Ingestion) -> DB -> Layer2 (Analysis) -> DB
  -> Layer3 (Market + Report) -> DB + HTML

Kullanım:
  python -m emlakflow.pipeline --source synthetic --count 400
  python -m emlakflow.pipeline --source csv --path data/samples/ilanlar.csv
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

import emlakflow.config as cfg
from emlakflow.db import session_scope, upsert_listing, save_analysis, save_market_index
from emlakflow.ingestion.base import register_all, AdapterRegistry
from emlakflow.analysis import analyze_all, compute_region_medians
from emlakflow.market import compute_market_index
from emlakflow.reporting import render_report, save_report


def run(source: str = "synthetic", count: int = 400, path: str | None = None,
        report: bool = True) -> dict:
    register_all()
    kwargs = {}
    if source == "synthetic":
        kwargs["count"] = count
    elif source == "csv":
        if not path:
            path = str(cfg.SAMPLE_DIR / "ilanlar.csv")
        kwargs["path"] = path

    adapter = AdapterRegistry.get(source, **kwargs)
    print(f"[Layer1] '{source}' kaynağından veri çekiliyor...")
    listings = adapter.fetch()
    print(f"  -> {len(listings)} ilan normalize edildi.")

    with session_scope() as s:
        for l in listings:
            upsert_listing(s, l)
    print("[DB] İlanlar kaydedildi.")

    print("[Layer2] Finansal analiz hesaplanıyor...")
    analyses = analyze_all(listings)
    with session_scope() as s:
        for a in analyses:
            save_analysis(s, a)
    print(f"  -> {len(analyses)} analiz kaydedildi.")

    print("[Layer3] Piyasa endeksi hesaplanıyor...")
    market = compute_market_index(listings)
    with session_scope() as s:
        for m in market:
            save_market_index(s, m)
    print(f"  -> {len(market)} segment endekslendi.")

    if report:
        html = render_report(listings, analyses, market)
        p = save_report(html)
        print(f"[Layer3] Rapor üretildi: {p}")

    # Özet
    best = sorted(analyses, key=lambda a: a.endeks_skoru, reverse=True)[:3]
    print("\n=== EMLAKFLOW ÖZET ===")
    for m in market[:5]:
        print(f"  {m.segment:24s} endeks={m.endeks_degeri:5.1f}  medyan_m2={m.medyan_m2:,.0f}₺")
    print("  En iyi ilanlar:")
    for a in best:
        l = next((x for x in listings if x.id == a.listing_id), None)
        print(f"   - {l.baslik if l else a.listing_id}: {a.endeks_skoru}/100 (getiri %{a.getiri_orani})")
    return {"listings": len(listings), "analyses": len(analyses), "segments": len(market)}


def main(argv=None):
    ap = argparse.ArgumentParser(description="EMLAKFLOW pipeline")
    ap.add_argument("--source", default="synthetic", choices=["synthetic", "csv"])
    ap.add_argument("--count", type=int, default=400)
    ap.add_argument("--path", default=None)
    ap.add_argument("--no-report", action="store_true")
    args = ap.parse_args(argv)
    run(source=args.source, count=args.count, path=args.path, report=not args.no_report)


if __name__ == "__main__":
    main()
