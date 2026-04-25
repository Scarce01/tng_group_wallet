"""Local ML inference for the pool agent.

Two ONNX models live here, trained offline (see /ml/ in the repo root):

* `classifier`  — DistilBERT fine-tuned on Malaysian transactions; returns a
                  category label like "transport_petrol" or "groceries".
* `anomaly`     — Isolation Forest over 13 engineered features; returns an
                  anomaly score per transaction.

Both modules degrade gracefully:
- If the model files aren't present (typical in dev before training), the
  module logs a warning at import-time and the public functions return None.
- Callers should treat None as "no signal" and fall back to rule-based
  heuristics or skip the ML enrichment for that turn.
"""
from .classifier import classify_transaction, classifier_status
from .anomaly import score_transactions, anomaly_status

__all__ = [
    "classify_transaction",
    "classifier_status",
    "score_transactions",
    "anomaly_status",
]
