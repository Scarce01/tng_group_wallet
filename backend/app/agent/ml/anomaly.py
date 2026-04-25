"""Isolation-Forest anomaly detector — ONNX inference.

Loads `anomaly_detector.onnx` and `anomaly_config.json` (which carries the
feature names and the threshold derived at training time).

Public entry point is `score_transactions(rows)`. Each row is a dict with
keys matching `feature_names` from the config.

Like the classifier this fails open: missing model -> returns empty list, the
agent should treat that as "no anomaly signal".
"""
from __future__ import annotations

import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

import numpy as np

log = logging.getLogger(__name__)

_MODELS_DIR = Path(__file__).parent / "models"
_ONNX_PATH = _MODELS_DIR / "anomaly_detector.onnx"
_CONFIG_PATH = _MODELS_DIR / "anomaly_config.json"

_session = None
_feature_names: list[str] = []
_threshold: float = 0.5
_load_lock = threading.Lock()
_load_attempted = False
_load_error: Optional[str] = None


def _load() -> bool:
    global _session, _feature_names, _threshold, _load_attempted, _load_error
    with _load_lock:
        if _load_attempted:
            return _session is not None
        _load_attempted = True

        if not _ONNX_PATH.exists() or not _CONFIG_PATH.exists():
            _load_error = f"missing artifacts in {_MODELS_DIR}"
            log.warning("[anomaly] %s — score_transactions will return []", _load_error)
            return False

        try:
            import onnxruntime as ort
        except ImportError as e:
            _load_error = f"onnxruntime missing: {e}"
            log.warning("[anomaly] %s", _load_error)
            return False

        try:
            cfg = json.loads(_CONFIG_PATH.read_text(encoding="utf-8"))
            _feature_names = list(cfg["feature_names"])
            _threshold = float(cfg.get("threshold", 0.5))
        except Exception as e:
            _load_error = f"bad config: {e}"
            log.warning("[anomaly] %s", _load_error)
            return False

        try:
            _session = ort.InferenceSession(
                str(_ONNX_PATH),
                providers=["CPUExecutionProvider"],
            )
        except Exception as e:
            _load_error = f"failed to load ONNX: {e}"
            log.warning("[anomaly] %s", _load_error)
            return False

        log.info(
            "[anomaly] loaded %s (%d features, threshold=%.3f)",
            _ONNX_PATH.name,
            len(_feature_names),
            _threshold,
        )
        return True


def anomaly_status() -> dict:
    return {
        "loaded": _session is not None,
        "modelPath": str(_ONNX_PATH),
        "modelExists": _ONNX_PATH.exists(),
        "configExists": _CONFIG_PATH.exists(),
        "loadError": _load_error,
        "featureCount": len(_feature_names),
        "threshold": _threshold,
    }


# ---------------- Feature engineering ----------------

# Mirrors ml/anomaly_detector/feature_engineering.py. Kept lightweight here so
# we can score live transactions without pulling pandas into the request path.

def _features_for_pool(transactions: list[dict], pool_budget: float) -> list[dict]:
    """Compute the feature dict for every tx in a pool. `transactions` should
    be in chronological order and each dict must contain:
       amount (float), created_at (datetime), category (str),
       recipient_id (str), user_id (str)
    """
    if not transactions:
        return []

    amounts = np.array([t["amount"] for t in transactions], dtype=float)
    pool_avg = float(amounts.mean()) if amounts.size else 1.0

    # group means
    by_user: dict[str, list[float]] = {}
    by_cat: dict[str, list[float]] = {}
    for t in transactions:
        by_user.setdefault(t["user_id"], []).append(t["amount"])
        by_cat.setdefault(t["category"], []).append(t["amount"])
    user_avg = {k: max(float(np.mean(v)), 1.0) for k, v in by_user.items()}
    cat_avg = {k: max(float(np.mean(v)), 1.0) for k, v in by_cat.items()}

    seen_recipients: set[str] = set()
    recipient_counts: dict[str, int] = {}
    for t in transactions:
        recipient_counts[t["recipient_id"]] = recipient_counts.get(t["recipient_id"], 0) + 1

    out: list[dict] = []
    daily_cum: dict[str, float] = {}
    total_cum = 0.0
    last_ts: Optional[datetime] = None

    for t in transactions:
        ts: datetime = t["created_at"]
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        delta_h = 0.0
        if last_ts is not None:
            delta_h = max((ts - last_ts).total_seconds(), 0)
        last_ts = ts

        date_key = ts.date().isoformat()
        daily_cum[date_key] = daily_cum.get(date_key, 0.0) + t["amount"]
        total_cum += t["amount"]

        # 2h velocity = how many tx in the 2h window ending at this tx, /10
        window_start = ts.timestamp() - 2 * 3600
        velocity = sum(
            1 for x in transactions
            if window_start <= (x["created_at"].replace(tzinfo=timezone.utc) if x["created_at"].tzinfo is None else x["created_at"]).timestamp() <= ts.timestamp()
        ) / 10.0

        is_new = 1.0 if t["recipient_id"] not in seen_recipients else 0.0
        seen_recipients.add(t["recipient_id"])

        feat = {
            "amount_vs_pool_avg": t["amount"] / max(pool_avg, 1.0),
            "amount_vs_user_avg": t["amount"] / user_avg.get(t["user_id"], 1.0),
            "amount_vs_category_avg": t["amount"] / cat_avg.get(t["category"], 1.0),
            "hour_normalized": ts.hour / 23.0,
            "day_of_week_normalized": ts.weekday() / 6.0,
            "is_weekend": 1.0 if ts.weekday() >= 5 else 0.0,
            "hours_since_last_tx": min(delta_h, 604800) / 604800,
            "recipient_frequency": recipient_counts[t["recipient_id"]] / max(len(transactions), 1),
            "is_new_recipient": is_new,
            "daily_cumulative_pct": daily_cum[date_key] / max(pool_budget, 1.0),
            "total_spent_pct": total_cum / max(pool_budget, 1.0),
            "log_amount": float(np.log1p(t["amount"])),
            "tx_velocity_2h": velocity,
        }
        out.append(feat)
    return out


def score_transactions(transactions: list[dict], pool_budget: float = 5000.0) -> list[dict]:
    """Score a chronologically-ordered list of transactions.

    Returns a list of {tx_id, score, isAnomaly, features} the same length as
    the input. Returns [] if the model isn't loaded.
    """
    if not _load() or _session is None or not transactions:
        return []

    feats = _features_for_pool(transactions, pool_budget)
    if not feats:
        return []

    X = np.array(
        [[f.get(name, 0.0) for name in _feature_names] for f in feats],
        dtype=np.float32,
    )

    try:
        outputs = _session.run(None, {"input": X})
    except Exception as e:
        log.warning("[anomaly] inference failed: %s", e)
        return []

    # IsolationForest ONNX usually returns (label, score). Label is +1/-1
    # (-1 = anomaly), score is the raw anomaly score.
    # Layout depends on skl2onnx version; try both common shapes.
    label = outputs[0]
    score = outputs[1] if len(outputs) > 1 else None

    results = []
    for i, tx in enumerate(transactions):
        try:
            lbl = int(label[i]) if label.ndim >= 1 else int(label[0][i])
        except Exception:
            lbl = 1
        try:
            sc = float(score[i]) if score is not None else 0.0
        except Exception:
            sc = 0.0
        results.append({
            "tx_id": tx.get("id"),
            "score": sc,
            "isAnomaly": lbl == -1,
            "amount": tx["amount"],
            "category": tx["category"],
            "createdAt": tx["created_at"].isoformat() if hasattr(tx["created_at"], "isoformat") else str(tx["created_at"]),
        })
    return results
