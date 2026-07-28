"""EMLAKFLOW — Katman 2: Doğal dil anlatı (LLM veya kural-tabanlı fallback).

LLM kullanılabilirse (nous/OpenRouter) zengin rapor üretir; aksi halde
deterministik kural-tabanlı anlatı döndürür (offline güvence).
"""
from __future__ import annotations
import os
from emlakflow.models import Listing


def _fmt_try(v: float) -> str:
    return f"{v:,.0f} ₺"


def build_narrative(l: Listing, m2p, region_med, degerleme, getiri, risk, endeks) -> str:
    """Önce LLM dene, başarısızsa kural-tabanlı fallback."""
    try:
        return _llm_narrative(l, m2p, region_med, degerleme, getiri, risk, endeks)
    except Exception:
        return _rule_narrative(l, m2p, region_med, degerleme, getiri, risk, endeks)


def _rule_narrative(l, m2p, region_med, degerleme, getiri, risk, endeks) -> str:
    seg = f"{l.il}/{l.ilce} ({l.mahalle})"
    ucuz_pahali = "bölge ortalamasının altında" if degerleme > 0 else "bölge ortalamasının üzerinde"
    deger_yorum = (
        f"m² başına {_fmt_try(m2p)} fiyatıyla {seg} bölgesinde {ucuz_pahali}. "
        f"Bölge medyanı m² {_fmt_try(region_med)}."
    )
    getiri_yorum = (
        f"Tahmini brüt getiri %{getiri:.1f} (yıllık kira ~{_fmt_try(l.fiyat*getiri)})."
    )
    risk_yorum = "risk " + ("yüksek" if risk > 60 else "orta" if risk > 35 else "düşük") + "."
    tavsiye = (
        "Endeks skoru yüksek; yatırım için değerlendirilebilir."
        if endeks >= 60 else
        "Endeks skoru orta; bölge ve fiyatı dikkatle karşılaştırın."
        if endeks >= 40 else
        "Endeks skoru düşük; risk/price açısından temkinli yaklaşın."
    )
    return f"{deger_yorum} {getiri_yorum} {risk_yorum} {tavsiye}"


def _llm_narrative(l, m2p, region_med, degerleme, getiri, risk, endeks) -> str:
    """Opsiyonel LLM anlatısı (OPENROUTER_API_KEY varsa)."""
    key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("NOUS_API_KEY")
    if not key:
        raise RuntimeError("LLM anahtarı yok")
    # Hafif çağrı: gerçek implementasyonda OpenAI/OpenRouter client kullanılır.
    # MVP'de kural-tabanlıya düşürürüz ki ağ bağımlılığı olmasın.
    raise RuntimeError("LLM devre dışı (MVP)")
