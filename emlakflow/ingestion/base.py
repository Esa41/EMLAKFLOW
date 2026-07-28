"""EMLAKFLOW — Katman 1: Veri & Ingestion adaptör arayüzü.

Tüm veri kaynakları bu arayüzü uygular. Böylece MVP'de sentetik veri,
sonra resmi API veya CSV ile değiştirilebilir; üst katmanlar etkilenmez.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Iterator, List

from emlakflow.models import Listing


class DataSourceAdapter(ABC):
    """Veri kaynağı soyut sınıfı."""

    name: str = "abstract"

    @abstractmethod
    def fetch(self, limit: int | None = None) -> List[Listing]:
        """Kaynaktan ilanları çek ve normalize edilmiş liste döndür."""
        raise NotImplementedError

    # İsteğe bağlı streaming desteği (büyük kaynaklar için)
    def stream(self, batch: int = 100) -> Iterator[Listing]:
        for lst in self.fetch():
            yield lst


class AdapterRegistry:
    _adapters: dict[str, type[DataSourceAdapter]] = {}

    @classmethod
    def register(cls, key: str, adapter: type[DataSourceAdapter]) -> None:
        cls._adapters[key] = adapter

    @classmethod
    def get(cls, key: str, **kwargs) -> DataSourceAdapter:
        if key not in cls._adapters:
            raise KeyError(f"Bilinmeyen veri kaynağı: {key}. Mevcut: {list(cls._adapters)}")
        return cls._adapters[key](**kwargs)

    @classmethod
    def available(cls) -> list[str]:
        return list(cls._adapters.keys())


def register_all() -> None:
    """Tüm adaptörleri kaydet (import yan etkisi)."""
    from emlakflow.ingestion.synthetic import SyntheticAdapter
    from emlakflow.ingestion.csv_source import CSVAdapter
    from emlakflow.ingestion.sahibinden_api import SahibindenOfficialAPIAdapter
    AdapterRegistry.register("synthetic", SyntheticAdapter)
    AdapterRegistry.register("csv", CSVAdapter)
    AdapterRegistry.register("sahibinden_api", SahibindenOfficialAPIAdapter)
