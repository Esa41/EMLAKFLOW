"""EMLAKFLOW — Katman 3: Piyasa Endeksi hesaplama."""
from __future__ import annotations
from statistics import median
from collections import defaultdict

from emlakflow.models import Listing, MarketIndex
from emlakflow.analysis.core import _seg_key


def compute_market_index(listings: list[Listing]) -> list[MarketIndex]:
    """İlçe segmentleri için bileşik piyasa endeksi."""
    groups: dict[str, list[Listing]] = defaultdict(list)
    for l in listings:
        groups[_seg_key(l)].append(l)

    out: list[MarketIndex] = []
    for seg, items in groups.items():
        m2_prices = [i.fiyat / i.m2 for i in items if i.m2 and i.m2 > 0]
        if not m2_prices:
            continue
        med_m2 = median(m2_prices)
        avg_m2 = sum(m2_prices) / len(m2_prices)

        # Fiyat momentumu: yeni ilanların ortalaması / eski ilanların ortalaması
        # (ilan_tarihi'ne göre basit iki yarıya bölme)
        sorted_by_date = sorted(items, key=lambda x: x.ilan_tarihi)
        half = max(1, len(sorted_by_date) // 2)
        old_half = [x.fiyat / x.m2 for x in sorted_by_date[:half] if x.m2]
        new_half = [x.fiyat / x.m2 for x in sorted_by_date[half:] if x.m2]
        momentum = 0.0
        if old_half and new_half:
            momentum = (sum(new_half) / len(new_half) - sum(old_half) / len(old_half)) / (sum(old_half) / len(old_half)) * 100

        # Arz/talep dengesi: yeni ilan oranı (yüksek arz -> talep lehine değil)
        supply = len(items)
        balance = max(-100.0, min(100.0, 50 - supply / 5))  # çok arz -> negatif

        endeks = max(0.0, min(100.0, 50 + momentum * 0.5 + balance * 0.2))
        out.append(MarketIndex(
            segment=seg.replace("|", " / "), ilan_sayisi=len(items),
            medyan_m2=round(med_m2, 2), ortalama_m2=round(avg_m2, 2),
            fiyat_momentum=round(momentum, 2), arz_talep_dengesi=round(balance, 1),
            endeks_degeri=round(endeks, 1),
        ))
    return sorted(out, key=lambda x: x.endeks_degeri, reverse=True)
