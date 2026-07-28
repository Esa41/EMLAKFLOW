"""EMLAKFLOW — merkezi yapılandırma."""
from __future__ import annotations
import os
from pathlib import Path

BASE_DIR = Path(os.environ.get("EMLAKFLOW_HOME", r"C:\Users\ESA41\emlakflow"))
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "emlakflow.db"
SAMPLE_DIR = DATA_DIR / "samples"
REPORT_DIR = DATA_DIR / "reports"

for d in (DATA_DIR, SAMPLE_DIR, REPORT_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Analiz ağırlıkları (endeks skoru için)
WEIGHTS = {
    "degerleme": 0.40,   # bölgeye göre ucuzluk (yüksek = iyi)
    "getiri": 0.25,      # tahmini getiri
    "risk_neg": 0.20,    # risk (yüksek = kötü, negatif katkı)
    "likidite": 0.15,    # likidite (yüksek = iyi)
}

# Varsayılan brüt kira çarpanı (satılık ilan için yıllık kira / fiyat)
DEFAULT_GROSS_YIELD = 0.035  # %3.5 brüt getiri varsayımı

# Otomasyon
SCHEDULE_MINUTES = int(os.environ.get("EMLAKFLOW_SCHEDULE_MIN", "360"))


def ensure_dirs() -> None:
    for d in (DATA_DIR, SAMPLE_DIR, REPORT_DIR):
        d.mkdir(parents=True, exist_ok=True)
