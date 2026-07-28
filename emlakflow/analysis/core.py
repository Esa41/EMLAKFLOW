"""EMLAKFLOW — Katman 2: Fiyat & Piyasa Analizörü (AI Core, istatistiksel kısım).

İlan başına finansal endeks üretir. LLM anlatısı için ayrı modül (narrative.py).
"""
from __future__ import annotations
from statistics import median
from datetime import date

import emlakflow.config as cfg
from emlakflow.models import Listing, Analysis
from emlakflow.analysis.narrative import build_narrative


def _seg_key(l: Listing) -> str:
    return f"{l.il}|{l.ilce}"


def compute_region_medians(listings: list[Listing]) -> dict[str, float]:
    """İlçe bazında m2 başına medyan fiyat."""
    by_seg: dict[str, list[float]] = {}
    for l in listings:
        if l.m2 and l.m2 > 0:
            by_seg.setdefault(_seg_key(l), []).append(l.fiyat / l.m2)
    return {seg: median(v) for seg, v in by_seg.items() if v}


def _estimate_annual_rent(l: Listing, m2_basina: float, bolge_medyani: float) -> float:
    """Satılık ilan için tahmini yıllık brüt kira.

    Finansal mantık: piyasaya göre ucuz bir ilanın (m² fiyatı bölge
    medyanının altında) brüt getirisi daha yüksektir. Bu yüzden getiri,
    bölge medyanına göre ucuzluk oranıyla ölçeklenir.
    Kiralık ilanlarda getiri ayrıca hesaplanmaz (0).
    """
    if l.emlak_turu == "kiralik" or l.fiyat <= 0:
        return 0.0
    ratio = (bolge_medyani / m2_basina) if (m2_basina and bolge_medyani) else 1.0
    return float(l.fiyat) * cfg.DEFAULT_GROSS_YIELD * ratio


def analyze_listing(l: Listing, region_medians: dict[str, float]) -> Analysis:
    m2_basina = (l.fiyat / l.m2) if l.m2 and l.m2 > 0 else 0.0
    bolge_medyani = region_medians.get(_seg_key(l), m2_basina)
    is_kiralik = l.emlak_turu == "kiralik"

    # Değerleme: bölge medyanına göre ucuzluk (pozitif = ucuz/iyi)
    if bolge_medyani > 0:
        degerleme = (bolge_medyani - m2_basina) / bolge_medyani * 100
    else:
        degerleme = 0.0

    yillik_kira = _estimate_annual_rent(l, m2_basina, bolge_medyani)
    getiri = (yillik_kira / l.fiyat) if l.fiyat > 0 else 0.0

    # Risk skoru (0-100, yüksek = riskli): yaş + fiyat oynaklığı proxy'si
    risk = 0.0
    if l.bina_yasi is not None:
        risk += min(l.bina_yasi, 40) * 1.2  # eski bina -> risk
    if l.m2 <= 0:
        risk += 30
    risk = max(0.0, min(100.0, risk))

    # Likidite (0-100): düşük fiyatlı ve merkezi -> daha likit (basit proxy)
    likidite = 50.0
    if l.fiyat > 0:
        if l.fiyat < 3_000_000:
            likidite += 25
        elif l.fiyat > 15_000_000:
            likidite -= 25
    if is_kiralik:
        likidite = 60.0  # kiralık daha hızlı el değiştirir
    likidite = max(0.0, min(100.0, likidite))

    # Bileşen puanları (0-100)
    degerleme_puan = max(0.0, min(100.0, 50 + degerleme * 2))
    getiri_puan = min(100.0, getiri / 0.06 * 100) if not is_kiralik else 50.0
    risk_puan = 100.0 - risk
    likidite_puan = likidite

    # Bileşik endeks skoru
    w = cfg.WEIGHTS
    endeks = (
        w["degerleme"] * degerleme_puan
        + w["getiri"] * getiri_puan
        + w["risk_neg"] * risk_puan
        + w["likidite"] * likidite_puan
    )
    endeks = max(0.0, min(100.0, endeks))

    anlati = build_narrative(l, m2_basina, bolge_medyani, degerleme, getiri, risk, endeks)

    return Analysis(
        listing_id=l.id, m2_basina_fiyat=round(m2_basina, 2),
        bolge_medyani_m2=round(bolge_medyani, 2),
        degerleme_skoru=round(degerleme, 2),
        tahmini_yillik_kira=round(yillik_kira, 2),
        getiri_orani=round(getiri * 100, 2),
        risk_skoru=round(risk, 1), likidite_skoru=round(likidite, 1),
        endeks_skoru=round(endeks, 1), anlati=anlati,
    )


def analyze_all(listings: list[Listing]) -> list[Analysis]:
    region_medians = compute_region_medians(listings)
    return [analyze_listing(l, region_medians) for l in listings]
