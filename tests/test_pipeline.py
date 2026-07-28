"""EMLAKFLOW — test paketi.

Gerçek pipeline'ı sentetik veriyle çalıştırır ve temel sözleşmeleri doğrular.
"""
from __future__ import annotations
from emlakflow.ingestion.base import register_all, AdapterRegistry
from emlakflow.analysis import analyze_all, compute_region_medians
from emlakflow.market import compute_market_index
from emlakflow.models import Listing


def test_synthetic_ingestion():
    register_all()
    adapter = AdapterRegistry.get("synthetic", count=50)
    listings = adapter.fetch()
    assert len(listings) == 50
    assert all(isinstance(l, Listing) for l in listings)
    # normalize kontrolü
    assert all(l.fiyat > 0 and l.m2 > 0 for l in listings)


def test_analysis_produces_scores():
    register_all()
    listings = AdapterRegistry.get("synthetic", count=80).fetch()
    medians = compute_region_medians(listings)
    assert medians, "bölge medyanları hesaplanmalı"
    analyses = analyze_all(listings)
    assert len(analyses) == len(listings)
    for a in analyses:
        assert 0.0 <= a.endeks_skoru <= 100.0
        assert a.anlati  # anlatı üretilmiş olmalı


def test_market_index():
    register_all()
    listings = AdapterRegistry.get("synthetic", count=120).fetch()
    market = compute_market_index(listings)
    assert market, "en az bir segment endekslenmeli"
    assert all(0.0 <= m.endeks_degeri <= 100.0 for m in market)
