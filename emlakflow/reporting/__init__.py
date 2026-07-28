"""EMLAKFLOW — Katman 3: Endeks Raporlama (HTML + Piyasa raporu)."""
from __future__ import annotations
from datetime import datetime
from pathlib import Path

import emlakflow.config as cfg
from emlakflow.models import Listing, Analysis, MarketIndex


def _fmt(v) -> str:
    return f"{v:,.0f} ₺"


HTML = """<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<title>EMLAKFLOW — Piyasa Analiz Raporu</title>
<style>
 body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}}
 header{{background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:24px 32px}}
 h1{{margin:0;font-size:22px}} .sub{{opacity:.8;font-size:13px}}
 .wrap{{padding:24px 32px;max-width:1100px;margin:auto}}
 table{{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}}
 th,td{{padding:8px 10px;border-bottom:1px solid #334155;text-align:left}}
 th{{color:#94a3b8;font-weight:600}}
 .card{{background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0}}
 .score{{font-size:28px;font-weight:700}}
 .good{{color:#34d399}} .mid{{color:#fbbf24}} .bad{{color:#f87171}}
 .bar{{height:8px;border-radius:4px;background:#334155;overflow:hidden}}
 .bar > i{{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#34d399)}}
</style></head><body>
<header><h1>🏠 EMLAKFLOW — Piyasa Analiz Raporu</h1>
<div class="sub">Oluşturulma: {ts} · {n} ilan analiz edildi</div></header>
<div class="wrap">
<h2>📊 Piyasa Endeksi (İlçe Segmentleri)</h2>
<table><tr><th>Segment</th><th>İlan</th><th>Medyan m²</th><th>Momentum %</th><th>Endeks</th></tr>
{market_rows}
</table>
<h2>🔎 En İyi 10 İlan (Endeks Skoru)</h2>
{listing_cards}
</div></body></html>"""


def _score_class(v: float) -> str:
    return "good" if v >= 60 else "mid" if v >= 40 else "bad"


def render_report(listings: list[Listing], analyses: list[Analysis],
                  market: list[MarketIndex], top_n: int = 10) -> str:
    by_id = {a.listing_id: a for a in analyses}
    ranked = sorted(analyses, key=lambda a: a.endeks_skoru, reverse=True)[:top_n]

    market_rows = "".join(
        f"<tr><td>{m.segment}</td><td>{m.ilan_sayisi}</td>"
        f"<td>{_fmt(m.medyan_m2)}</td><td>{m.fiyat_momentum:+.1f}</td>"
        f"<td><b>{m.endeks_degeri:.1f}</b></td></tr>"
        for m in market
    )
    cards = ""
    for a in ranked:
        l = next((x for x in listings if x.id == a.listing_id), None)
        if not l:
            continue
        cards += (
            f'<div class="card"><div class="score {_score_class(a.endeks_skoru)}">'
            f'{a.endeks_skoru:.1f}/100</div>'
            f'<b>{l.baslik}</b> · {l.il}/{l.ilce}<br>'
            f'Fiyat: {_fmt(l.fiyat)} · m²: {l.m2} · Getiri: %{a.getiri_orani}<br>'
            f'<div class="bar"><i style="width:{a.endeks_skoru}%"></i></div>'
            f'<p>{a.anlati}</p></div>'
        )
    return HTML.format(ts=datetime.now().strftime("%d.%m.%Y %H:%M"), n=len(listings),
                       market_rows=market_rows, listing_cards=cards)


def save_report(html: str, name: str = "report") -> Path:
    cfg.ensure_dirs()
    p = cfg.REPORT_DIR / f"{name}.html"
    p.write_text(html, encoding="utf-8")
    return p
