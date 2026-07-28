"""EMLAKFLOW — Katman 4: FastAPI servisi.

Uç noktalar:
  GET /            -> sağlık
  GET /listings    -> ilanlar (filtre: il, ilce, limit)
  GET /analysis/{listing_id}
  GET /market-index
  GET /reports/latest -> son HTML rapor
"""
from __future__ import annotations
from fastapi import FastAPI, HTTPException, Query

from emlakflow.db import session_scope, ListingRow, AnalysisRow, MarketIndexRow
from sqlalchemy import select

app = FastAPI(title="EMLAKFLOW API", version="0.1.0")


@app.get("/")
def health():
    return {"status": "ok", "service": "emlakflow", "version": "0.1.0"}


@app.get("/listings")
def get_listings(il: str | None = None, ilce: str | None = None, limit: int = 50):
    with session_scope() as s:
        stmt = select(ListingRow)
        if il:
            stmt = stmt.where(ListingRow.il == il)
        if ilce:
            stmt = stmt.where(ListingRow.ilce == ilce)
        stmt = stmt.limit(limit)
        rows = s.execute(stmt).scalars().all()
        return [r.id for r in rows], [{
            "id": r.id, "baslik": r.baslik, "fiyat": r.fiyat, "il": r.il,
            "ilce": r.ilce, "m2": r.m2, "emlak_turu": r.emlak_turu,
        } for r in rows]


@app.get("/analysis/{listing_id}")
def get_analysis(listing_id: str):
    with session_scope() as s:
        row = s.get(AnalysisRow, listing_id)
        if not row:
            raise HTTPException(404, "Analiz bulunamadı")
        return {c.name: getattr(row, c.name) for c in AnalysisRow.__table__.columns}


@app.get("/market-index")
def get_market_index():
    with session_scope() as s:
        rows = s.execute(select(MarketIndexRow)).scalars().all()
        return [{c.name: getattr(r, c.name) for c in MarketIndexRow.__table__.columns}
                for r in rows]


@app.get("/reports/latest")
def latest_report():
    import emlakflow.config as cfg
    p = cfg.REPORT_DIR / "report.html"
    if not p.exists():
        raise HTTPException(404, "Rapor henüz üretilmedi — pipeline'ı çalıştırın")
    from fastapi.responses import HTMLResponse
    return HTMLResponse(p.read_text(encoding="utf-8"))
