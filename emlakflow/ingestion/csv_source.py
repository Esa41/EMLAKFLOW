"""EMLAKFLOW — Katman 1: CSV import adaptörü.

Kullanıcının kendi topladığı ilanları yükler. Beklenen sütunlar:
id,source,baslik,fiyat,para_birimi,emlak_turu,il,ilce,mahalle,
m2,oda,bina_yasi,aciklama,gorseller,lat,lng,ilan_tarihi,url
(gorseller noktalı virgülle ayrılmış URL dizisi olabilir).
"""
from __future__ import annotations
from pathlib import Path

import pandas as pd

from emlakflow.ingestion.base import DataSourceAdapter
from emlakflow.models import Listing
from datetime import date


class CSVAdapter(DataSourceAdapter):
    name = "csv"

    def __init__(self, path: str | Path):
        self.path = Path(path)

    def fetch(self, limit: int | None = None) -> list[Listing]:
        if not self.path.exists():
            raise FileNotFoundError(f"CSV bulunamadı: {self.path}")
        df = pd.read_csv(self.path)
        rows = df.to_dict("records")
        if limit:
            rows = rows[:limit]
        out: list[Listing] = []
        for r in rows:
            gorseller = r.get("gorseller")
            if isinstance(gorseller, str):
                gorseller = [u.strip() for u in gorseller.split(";") if u.strip()]
            elif gorseller is None:
                gorseller = []
            ilan_tarihi = r.get("ilan_tarihi")
            if isinstance(ilan_tarihi, str):
                from datetime import date as _d
                ilan_tarihi = _d.fromisoformat(ilan_tarihi)
            elif pd.isna(ilan_tarihi):
                ilan_tarihi = date.today()
            out.append(Listing(
                id=str(r.get("id") or f"csv:{r.get('url','')}"),
                source="csv",
                baslik=str(r.get("baslik", "")),
                fiyat=float(r.get("fiyat", 0) or 0),
                para_birimi=str(r.get("para_birimi", "TRY")),
                emlak_turu=str(r.get("emlak_turu", "satilik")),
                il=str(r.get("il", "")), ilce=str(r.get("ilce", "")),
                mahalle=str(r.get("mahalle", "")),
                m2=float(r.get("m2", 0) or 0),
                oda=float(r.get("oda", 0) or 0),
                bina_yasi=(int(r["bina_yasi"]) if not pd.isna(r.get("bina_yasi", float("nan"))) else None),
                aciklama=str(r.get("aciklama", "")),
                gorseller=gorseller,
                lat=(float(r["lat"]) if not pd.isna(r.get("lat", float("nan"))) else None),
                lng=(float(r["lng"]) if not pd.isna(r.get("lng", float("nan"))) else None),
                ilan_tarihi=ilan_tarihi,
                url=str(r.get("url", "")),
            ))
        return out
