"""EMLAKFLOW — Katman 4: Streamlit web arayüzü (MVP dashboard).

Çalıştır:  streamlit run emlakflow/app.py
"""
from __future__ import annotations
import streamlit as st

import emlakflow.config as cfg
from emlakflow.db import session_scope, ListingRow, AnalysisRow, MarketIndexRow
from sqlalchemy import select, func


def main():
    st.set_page_config(page_title="EMLAKFLOW", layout="wide")
    st.title("🏠 EMLAKFLOW — Piyasa Analiz Paneli")

    with session_scope() as s:
        total = s.execute(select(func.count()).select_from(ListingRow)).scalar() or 0
        c1, c2, c3 = st.columns(3)
        c1.metric("Toplam İlan", total)
        with session_scope() as s2:
            segs = s2.execute(select(func.count()).select_from(MarketIndexRow)).scalar() or 0
        c2.metric("Piyasa Segmenti", segs)
        with session_scope() as s3:
            avg = s3.execute(select(func.avg(AnalysisRow.endeks_skoru))).scalar() or 0
        c3.metric("Ort. Endeks", f"{avg:.1f}")

    st.subheader("Piyasa Endeksi")
    with session_scope() as s:
        rows = s.execute(select(MarketIndexRow)).scalars().all()
        if rows:
            data = [{"Segment": r.segment, "İlan": r.ilan_sayisi,
                     "Medyan m²": f"{r.medyan_m2:,.0f}₺",
                     "Momentum %": r.fiyat_momentum,
                     "Endeks": r.endeks_degeri} for r in rows]
            st.dataframe(data)

    st.subheader("En İyi İlanlar (Endeks)")
    with session_scope() as s:
        rows = s.execute(select(AnalysisRow).order_by(AnalysisRow.endeks_skoru.desc()).limit(20)).scalars().all()
        for a in rows:
            l = s.get(ListingRow, a.listing_id)
            if not l:
                continue
            with st.expander(f"{a.endeks_skoru}/100 — {l.baslik} ({l.il}/{l.ilce})"):
                st.write(f"**Fiyat:** {l.fiyat:,.0f} ₺  |  **m²:** {l.m2}  |  **Getiri:** %{a.getiri_orani}")
                st.write(a.anlati)
                if l.gorseller:
                    st.image(l.gorseller[:3], width=150)

    st.sidebar.markdown(f"Veritabanı: `{cfg.DB_PATH}`")


if __name__ == "__main__":
    main()
