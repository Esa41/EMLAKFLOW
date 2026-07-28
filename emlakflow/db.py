"""EMLAKFLOW — SQLite kalıcılık katmanı (SQLAlchemy ile)."""
from __future__ import annotations
from pathlib import Path
from contextlib import contextmanager

from sqlalchemy import (
    create_engine, Column, String, Float, Integer, Date, Text, JSON, UniqueConstraint,
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

import emlakflow.config as cfg
from emlakflow.models import Listing, Analysis, MarketIndex

Base = declarative_base()


class ListingRow(Base):
    __tablename__ = "listings"
    id = Column(String, primary_key=True)
    source = Column(String, index=True)
    baslik = Column(String)
    fiyat = Column(Float)
    para_birimi = Column(String)
    emlak_turu = Column(String)
    il = Column(String, index=True)
    ilce = Column(String, index=True)
    mahalle = Column(String)
    m2 = Column(Float)
    oda = Column(Float)
    bina_yasi = Column(Integer, nullable=True)
    aciklama = Column(Text)
    gorseller = Column(JSON)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    ilan_tarihi = Column(Date)
    url = Column(String)


class AnalysisRow(Base):
    __tablename__ = "analyses"
    listing_id = Column(String, primary_key=True)
    m2_basina_fiyat = Column(Float)
    bolge_medyani_m2 = Column(Float)
    degerleme_skoru = Column(Float)
    tahmini_yillik_kira = Column(Float)
    getiri_orani = Column(Float)
    risk_skoru = Column(Float)
    likidite_skoru = Column(Float)
    endeks_skoru = Column(Float)
    anlati = Column(Text)


class MarketIndexRow(Base):
    __tablename__ = "market_index"
    segment = Column(String, primary_key=True)
    ilan_sayisi = Column(Integer)
    medyan_m2 = Column(Float)
    ortalama_m2 = Column(Float)
    fiyat_momentum = Column(Float)
    arz_talep_dengesi = Column(Float)
    endeks_degeri = Column(Float)


_ENGINE = None
_Session = None


def get_engine():
    global _ENGINE
    if _ENGINE is None:
        cfg.ensure_dirs()
        _ENGINE = create_engine(f"sqlite:///{cfg.DB_PATH}")
        Base.metadata.create_all(_ENGINE)
    return _ENGINE


def get_session_factory():
    global _Session
    if _Session is None:
        _Session = sessionmaker(bind=get_engine())
    return _Session


@contextmanager
def session_scope():
    factory = get_session_factory()
    s = factory()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def upsert_listing(s, listing: Listing) -> None:
    row = ListingRow(**listing.to_dict())
    stmt = sqlite_insert(ListingRow).values(**listing.to_dict())
    stmt = stmt.on_conflict_do_update(
        index_elements=["id"],
        set_={k: getattr(row, k) for k in listing.to_dict() if k != "id"},
    )
    s.execute(stmt)


def save_analysis(s, a: Analysis) -> None:
    s.merge(AnalysisRow(**asdict_safe(a)))


def save_market_index(s, m: MarketIndex) -> None:
    s.merge(MarketIndexRow(**asdict_safe(m)))


def asdict_safe(obj):
    from dataclasses import asdict
    return asdict(obj)
