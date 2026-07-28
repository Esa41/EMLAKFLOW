"""EMLAKFLOW — veri modelleri (dataclass tabanlı, kaynak-bağımsız)."""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from datetime import date
from typing import Optional


@dataclass
class Listing:
    """Kaynak-bağımsız normalize edilmiş ilan."""
    id: str                     # kaynak + url hash'i (tekilleştirme anahtarı)
    source: str                 # "synthetic" | "csv" | "sahibinden_api"
    baslik: str
    fiyat: float
    para_birimi: str = "TRY"
    emlak_turu: str = "satilik" # "satilik" | "kiralik"
    il: str = ""
    ilce: str = ""
    mahalle: str = ""
    m2: float = 0.0
    oda: float = 0.0            # 1+1 -> oda=1, salon=1 (toplam daire büyüklüğü m2 ile)
    bina_yasi: Optional[int] = None
    aciklama: str = ""
    gorseller: list[str] = field(default_factory=list)
    lat: Optional[float] = None
    lng: Optional[float] = None
    ilan_tarihi: date = field(default_factory=date.today)
    url: str = ""

    def to_dict(self) -> dict:
        # DB'ye giderken ilan_tarihi date objesi kalmalı (SQLite Date tipi)
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "Listing":
        d = dict(d)
        if isinstance(d.get("ilan_tarihi"), str):
            d["ilan_tarihi"] = date.fromisoformat(d["ilan_tarihi"])
        return cls(**d)


@dataclass
class Analysis:
    """Tek bir ilanın finansal/pazar analizi."""
    listing_id: str
    m2_basina_fiyat: float
    bolge_medyani_m2: float
    degerleme_skoru: float       # + ise bölgeye göre ucuz
    tahmini_yillik_kira: float
    getiri_orani: float          # brüt getiri (%)
    risk_skoru: float            # 0-100 (yüksek = riskli)
    likidite_skoru: float        # 0-100 (yüksek = likit)
    endeks_skoru: float          # 0-100 bileşik
    anlati: str                  # doğal dil raporu


@dataclass
class MarketIndex:
    """İl/ilçe segmenti için piyasa endeksi."""
    segment: str                 # "İl / İlçe"
    ilan_sayisi: int
    medyan_m2: float
    ortalama_m2: float
    fiyat_momentum: float        # son dönem değişim %
    arz_talep_dengesi: float     # >0 talep lehine
    endeks_degeri: float         # 0-100 bileşik piyasa endeksi
