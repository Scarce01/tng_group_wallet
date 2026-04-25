"""DistilBERT transaction classifier — ONNX inference.

Loaded lazily on first use. If the .onnx file is missing the loader returns
None and `classify_transaction` becomes a no-op (returns None for every call).
That way the agent still works on a developer machine that hasn't run
training yet.
"""
from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Optional

import numpy as np

log = logging.getLogger(__name__)

_MODELS_DIR = Path(__file__).parent / "models"
_ONNX_PATH = _MODELS_DIR / "tx_classifier.onnx"
_TOKENIZER_DIR = _MODELS_DIR / "tokenizer"
_LABELS_PATH = _MODELS_DIR / "label_mapping.json"

_session = None
_tokenizer = None
_id2label: dict[int, str] = {}
_load_lock = threading.Lock()
_load_attempted = False
_load_error: Optional[str] = None


def _load() -> bool:
    """Attempt to load model + tokenizer. Cache the result. Idempotent."""
    global _session, _tokenizer, _id2label, _load_attempted, _load_error
    with _load_lock:
        if _load_attempted:
            return _session is not None
        _load_attempted = True

        if not _ONNX_PATH.exists():
            _load_error = f"ONNX model missing at {_ONNX_PATH}"
            log.warning("[classifier] %s — classify_transaction will return None", _load_error)
            return False

        try:
            import onnxruntime as ort
            from tokenizers import Tokenizer
        except ImportError as e:
            _load_error = f"missing deps: {e}"
            log.warning("[classifier] %s", _load_error)
            return False

        try:
            _session = ort.InferenceSession(
                str(_ONNX_PATH),
                providers=["CPUExecutionProvider"],
            )
        except Exception as e:
            _load_error = f"failed to load ONNX: {e}"
            log.warning("[classifier] %s", _load_error)
            return False

        # tokenizer.json is the HF fast-tokenizer format saved by export_onnx.py
        tok_json = _TOKENIZER_DIR / "tokenizer.json"
        if not tok_json.exists():
            _load_error = f"tokenizer.json missing at {tok_json}"
            log.warning("[classifier] %s", _load_error)
            _session = None
            return False
        try:
            _tokenizer = Tokenizer.from_file(str(tok_json))
            _tokenizer.enable_truncation(max_length=64)
            _tokenizer.enable_padding(length=64)
        except Exception as e:
            _load_error = f"tokenizer load failed: {e}"
            log.warning("[classifier] %s", _load_error)
            _session = None
            return False

        if _LABELS_PATH.exists():
            try:
                raw = json.loads(_LABELS_PATH.read_text(encoding="utf-8"))
                _id2label = {int(k): v for k, v in raw["id2label"].items()}
            except Exception as e:
                log.warning("[classifier] label_mapping.json bad (%s) — using id strings", e)

        log.info(
            "[classifier] loaded %s (%.1f MB), %d labels",
            _ONNX_PATH.name,
            _ONNX_PATH.stat().st_size / 1e6,
            len(_id2label),
        )
        return True


def classifier_status() -> dict:
    """Cheap health probe — does NOT trigger a load."""
    return {
        "loaded": _session is not None,
        "modelPath": str(_ONNX_PATH),
        "modelExists": _ONNX_PATH.exists(),
        "tokenizerExists": (_TOKENIZER_DIR / "tokenizer.json").exists(),
        "loadError": _load_error,
        "labelCount": len(_id2label),
    }


def classify_transaction(
    description: str,
    merchant_name: str = "",
    amount: float = 0.0,
    hour: int = 12,
) -> Optional[dict]:
    """Return {label, confidence} or None if model not available.

    Input format matches `ml/transaction_classifier/train.py`:
        "{description} [SEP] {merchant} [SEP] RM{amount} [SEP] hour:{hour}"
    """
    if not _load():
        return None
    if _session is None or _tokenizer is None:
        return None

    text = f"{description} [SEP] {merchant_name} [SEP] RM{amount} [SEP] hour:{hour}"
    enc = _tokenizer.encode(text)
    input_ids = np.array([enc.ids], dtype=np.int64)
    attn = np.array([enc.attention_mask], dtype=np.int64)

    try:
        logits = _session.run(
            None,
            {"input_ids": input_ids, "attention_mask": attn},
        )[0][0]
    except Exception as e:
        log.warning("[classifier] inference failed: %s", e)
        return None

    # softmax
    exp = np.exp(logits - np.max(logits))
    probs = exp / exp.sum()
    idx = int(np.argmax(probs))
    return {
        "label": _id2label.get(idx, f"class_{idx}"),
        "confidence": float(probs[idx]),
    }
