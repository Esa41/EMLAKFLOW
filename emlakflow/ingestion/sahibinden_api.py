"""EMLAKFLOW — Katman 1: Resmi sahibinden Kurumsal API adaptörü (stub).

NOT: sahibinden.com'un herkese açık "tüm ilanları çek" API'si YOKTUR.
Resmi API YALNIZCA Kurumsal Emlak Mağazası olan işletmelere, kendi
ilanlarını başka portala aktarmak için erişim anahtarı (API key) ile
verilir. Bu adaptör o resmi yolu kullanır — ToS uyumlu.

Kurumsal bir mağazanız ve API anahtarınız olduğunda:
  - SAHIBINDEN_API_KEY ortam değişkenini ayarlayın
  - gerçek endpoint'i (docs'tan) SAHIBINDEN_API_URL ile verin
  - fetch() içindeki isteği gerçek uç noktaya bağlayın

Bu, yasa dışı/ToS'sız scraping değil; SAHIBINDEN'in izin verdiği
yetkilendirilmiş üçüncü taraf akışıdır.
"""
from __future__ import annotations
import os
from datetime import date

import requests

from emlakflow.ingestion.base import DataSourceAdapter
from emlakflow.models import Listing


class SahibindenOfficialAPIAdapter(DataSourceAdapter):
    name = "sahibinden_api"

    def __init__(self, api_key: str | None = None, api_url: str | None = None):
        self.api_key = api_key or os.environ.get("SAHIBINDEN_API_KEY")
        self.api_url = api_url or os.environ.get(
            "SAHIBINDEN_API_URL", "https://api.sahibinden.com/v1/listings"
        )
        if not self.api_key:
            raise RuntimeError(
                "SAHIBINDEN_API_KEY tanımlı değil. Resmi API yalnızca Kurumsal "
                "Emlak Mağazası olan işletmelere, erişim anahtarı ile verilir."
            )

    def fetch(self, limit: int | None = None) -> list[Listing]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Accept": "application/json"}
        params = {"limit": limit or 100, "offset": 0}
        resp = requests.get(self.api_url, headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        payload = resp.json()
        # Gerçek şema docs'a göre burada eşlenir.
        return [self._map_item(it) for it in payload.get("items", [])]

    def _map_item(self, it: dict) -> Listing:
        return Listing(
            id=f"sahibinden:{it.get('id')}",
            source="sahibinden_api",
            baslik=it.get("title", ""),
            fiyat=float(it.get("price", 0)),
            para_birimi=it.get("currency", "TRY"),
            emlak_turu=it.get("listingType", "satilik"),
            il=it.get("city", ""), ilce=it.get("town", ""),
            mahalle=it.get("district", ""),
            m2=float(it.get("area", 0) or 0),
            oda=float(it.get("roomCount", 0) or 0),
            bina_yasi=it.get("buildingAge"),
            aciklama=it.get("description", ""),
            gorseller=it.get("images", []) or [],
            lat=it.get("latitude"), lng=it.get("longitude"),
            ilan_tarihi=date.fromisoformat(it["createdAt"][:10]) if it.get("createdAt") else date.today(),
            url=it.get("url", ""),
        )
