"""Per-pool BOCPD wrapper.

The raw `bocpd.BayesianOnlineChangePointDetector` is stateful — it remembers
the run-length distribution and sufficient statistics across calls. We want
that state to persist across requests for a given pool, but stay isolated
between pools, so we cache one detector per pool_id in memory.

Detector input is the spend amount (1-feature series, in the time order
transactions land). On each pool query we:
  1. Look up or create the detector.
  2. Replay any tx newer than the last one we processed.
  3. Return the latest changepoint signal.

The cache is best-effort and lives in the worker process — restart drops
state and the detector retrains on next call. That's intentional: BOCPD
converges within ~10 obs and we don't need durability for an advisory
signal.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from threading import Lock
from typing import Optional

import numpy as np

from .bocpd import BayesianOnlineChangePointDetector

log = logging.getLogger("agent.bocpd_service")

# 1 feature = the spend amount (log-transformed for stability)
_N_FEATURES = 1
# Hazard ~ 30: expect a regime change about every 30 spends. Trip/family
# pool spend cadence makes this a sensible default.
_HAZARD_LAMBDA = 30.0
_ALERT_THRESHOLD = 0.5


@dataclass
class _DetectorState:
    detector: BayesianOnlineChangePointDetector
    last_tx_id: Optional[str] = None
    last_signal: dict | None = None  # most recent update() return value
    n_processed: int = 0


_cache: dict[str, _DetectorState] = {}
_cache_lock = Lock()


def _get_or_create(pool_id: str) -> _DetectorState:
    with _cache_lock:
        st = _cache.get(pool_id)
        if st is None:
            st = _DetectorState(
                detector=BayesianOnlineChangePointDetector(
                    hazard_lambda=_HAZARD_LAMBDA,
                    n_features=_N_FEATURES,
                    alert_threshold=_ALERT_THRESHOLD,
                ),
            )
            _cache[pool_id] = st
        return st


def reset_pool(pool_id: str) -> None:
    """Drop cached detector for a pool — useful after seed/test resets."""
    with _cache_lock:
        _cache.pop(pool_id, None)


def changepoint_for_pool(
    pool_id: str,
    *,
    chronological_tx: list[dict],
) -> dict:
    """Run BOCPD over the pool's tx amount stream and return the latest signal.

    Parameters
    ----------
    pool_id : str
    chronological_tx : list of {id, amount, created_at}
        Must be sorted oldest-first. Only entries newer than the cached
        last_tx_id are processed (so back-to-back calls are O(new tx count),
        not O(n)).

    Returns
    -------
    dict with keys:
        available : bool
        changepointProb : float
        runLength : int
        isChangepoint : bool
        nProcessed : int
        lastTxId : str | None
    """
    if not chronological_tx:
        return {"available": False, "reason": "no transactions"}

    st = _get_or_create(pool_id)

    # Find the index after which we need to replay
    start_idx = 0
    if st.last_tx_id:
        for i, t in enumerate(chronological_tx):
            if t.get("id") == st.last_tx_id:
                start_idx = i + 1
                break
        else:
            # last_tx_id not in current list — pool was reseeded; reset.
            log.info("[bocpd] pool %s last_tx_id %s missing → reset", pool_id, st.last_tx_id)
            reset_pool(pool_id)
            return changepoint_for_pool(pool_id, chronological_tx=chronological_tx)

    new_rows = chronological_tx[start_idx:]
    last_signal = st.last_signal
    for tx in new_rows:
        amount = float(tx.get("amount") or 0)
        # log1p stabilizes the heavy-tailed amount distribution
        obs = np.array([np.log1p(amount)], dtype=np.float64)
        try:
            last_signal = st.detector.update(obs)
        except Exception as e:
            log.warning("[bocpd] update failed for pool %s: %s", pool_id, e)
            return {"available": False, "reason": str(e)}
        st.last_tx_id = tx.get("id")
        st.n_processed += 1

    st.last_signal = last_signal
    if last_signal is None:
        return {"available": False, "reason": "no observations processed"}

    return {
        "available": True,
        "changepointProb": float(last_signal.get("changepoint_prob", 0.0)),
        "runLength": int(last_signal.get("run_length", 0)),
        "isChangepoint": bool(last_signal.get("is_changepoint", False)),
        "nProcessed": st.n_processed,
        "lastTxId": st.last_tx_id,
    }
