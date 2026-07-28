"""EMLAKFLOW — Katman 1: Sentetik/Sample veri adaptörü.

MVP için gerçekçi, ToS-safe örnek veri üretir. İstanbul'un birkaç
ilçesinde fiyat dağılımlarını ve korelasyonları taklit eder.
"""
from __future__ import annotations
import hashlib
import random
from datetime import date, timedelta

from emlakflow.ingestion.base import DataSourceAdapter
from emlakflow.models import Listing

# Bölge bazlı temel m2 fiyatları (TRY) + volatilite — gerçekçi ama hayali
REGIONS = {
    ("İstanbul", "Kadıköy"):   {"base_m2": 85000, "vol": 0.18, "mahalleler": ["Caferağa", "Moda", "Fenerbahçe"]},
    ("İstanbul", "Beşiktaş"):  {"base_m2": 95000, "vol": 0.20, "mahalleler": ["Ortaköy", "Levent", "Bebek"]},
    ("İstanbul", "Üsküdar"):   {"base_m2": 70000, "vol": 0.15, "mahalleler": ["Kuzguncuk", "Çengelköy", "Salacak"]},
    ("İstanbul", "Bakırköy"):  {"base_m2": 65000, "vol": 0.14, "mahalleler": ["Yeşilköy", "Ataköy", "Florya"]},
    ("İstanbul", "Pendik"):    {"base_m2": 38000, "vol": 0.22, "mahalleler": ["Çamçeşme", "Kaynarca", "Sapanbağları"]},
    ("Ankara", "Çankaya"):     {"base_m2": 42000, "vol": 0.16, "mahalleler": ["Bahçelievler", "Kızılay", "Gaziosmanpaşa"]},
    ("İzmir", "Karşıyaka"):    {"base_m2": 50000, "vol": 0.17, "mahalleler": ["Alsancak", "Bostanlı", "Mavişehir"]},
}

ROOMS = [(1, 1), (2, 1), (3, 1), (3, 2), (4, 1)]
TYPES = ["satilik", "satilik", "satilik", "kiralik"]  # ağırlıklı


def _stable_hash(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:16]


class SyntheticAdapter(DataSourceAdapter):
    name = "synthetic"

    def __init__(self, count: int = 400, seed: int = 42):
        self.count = count
        self.seed = seed

    def fetch(self, limit: int | None = None) -> list[Listing]:
        n = limit or self.count
        rng = random.Random(self.seed)
        listings: list[Listing] = []
        today = date.today()

        for i in range(n):
            (il, ilce), meta = rng.choice(list(REGIONS.items()))
            mahalle = rng.choice(meta["mahalleler"])
            oda, salon = rng.choice(ROOMS)

            # daire büyüklüğü: oda sayısıyla korelasyonlu
            m2 = round((oda * 22 + salon * 18 + rng.uniform(-8, 14)), 1)
            m2 = max(40.0, m2)

            # m2 fiyatı: bölge tabanı * volatilite * küçük mahalle etkisi
            mahalle_factor = rng.uniform(0.9, 1.12)
            noise = rng.gauss(1.0, meta["vol"])
            m2_price = meta["base_m2"] * mahalle_factor * max(0.5, noise)
            fiyat = round(m2 * m2_price / 1000) * 1000  # binaya yuvarla

            emlak_turu = rng.choice(TYPES)
            bina_yasi = rng.choice([0, 1, 2, 3, 5, 8, 12, 20, 30])
            ilan_gunu = today - timedelta(days=rng.randint(0, 120))

            baslik = f"{ilce} {mahalle} {int(oda)+salon}.{oda} {emlak_turu}"
            aciklama = (
                f"{mahalle} bölgesinde, {int(bina_yasi)} yaşında binada {m2}m² "
                f"{int(oda)+salon+0} oda {emlak_turu} ilanı. "
                f"Site içerisinde, otopark ve 7/24 güvenlik mevcut."
            )
            gorseller = [f"https://sample.emlakflow.test/{_stable_hash(baslik+str(i))}.jpg"
                         for _ in range(rng.randint(2, 6))]

            lid = f"synthetic:{_stable_hash(baslik + str(i) + str(fiyat))}"
            listings.append(Listing(
                id=lid, source="synthetic", baslik=baslik, fiyat=fiyat,
                para_birimi="TRY", emlak_turu=emlak_turu, il=il, ilce=ilce,
                mahalle=mahalle, m2=m2, oda=int(oda)+salon, bina_yasi=bina_yasi,
                aciklama=aciklama, gorseller=gorseller,
                lat=round(rng.uniform(36, 42), 6), lng=round(rng.uniform(26, 40), 6),
                ilan_tarihi=ilan_gunu, url=f"https://sample.emlakflow.test/ilan/{lid}",
            ))
        return listings
