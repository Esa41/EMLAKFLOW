"""EMLAKFLOW — Katman 5: Otomasyon (zamanlanmış pipeline).

APScheduler ile periyodik veri çekimi + analiz + rapor.
Çalıştır: python -m emlakflow.automation
"""
from __future__ import annotations
import logging
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

import emlakflow.config as cfg
from emlakflow.pipeline import run

log = logging.getLogger("emlakflow.automation")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def job() -> None:
    log.info("Zamanlanmış pipeline başlıyor...")
    try:
        res = run(source="synthetic", count=400)
        log.info("Tamamlandı: %s", res)
    except Exception as e:  # tekrar denemeye devam et
        log.exception("Pipeline hatası: %s", e)


def start() -> None:
    sched = BlockingScheduler()
    sched.add_job(job, IntervalTrigger(minutes=cfg.SCHEDULE_MINUTES), id="emlakflow_pipe")
    log.info("Otomasyon başladı — her %d dk'da bir çalışacak. Durdurmak için Ctrl+C", cfg.SCHEDULE_MINUTES)
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Otomasyon durduruldu.")


if __name__ == "__main__":
    start()
