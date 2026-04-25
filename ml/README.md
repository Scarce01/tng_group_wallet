# ML Training Pipeline

Trains two models offline (Python), exports them to ONNX so the Node.js
server (`src/ml/`) can run inference with `onnxruntime-node` — zero Python
at runtime.

## Models

| Model | Purpose | Inference target |
|-------|---------|------------------|
| `tx_classifier.onnx` | DistilBERT fine-tuned on Malaysian transactions → 24 categories | <10 ms / tx |
| `anomaly_detector.onnx` | Isolation Forest over 13 engineered features | <5 ms / tx |

## Prerequisites

- **Python 3.11** on PATH (https://www.python.org/downloads/release/python-3119/)
- ~3 GB free disk (torch + transformers cache + DistilBERT base weights)
- Optional: NVIDIA GPU + CUDA 12.1 → install GPU torch first:
  ```
  pip install torch --index-url https://download.pytorch.org/whl/cu121
  ```

## One-shot training (recommended)

From the project root:

```
cd ml
run_training.bat
```

This script does everything: creates `.venv`, installs deps, trains the
classifier, exports ONNX, runs `evaluate.py`, generates synthetic data,
trains the anomaly detector, and exports its ONNX.

Expected wall time:
- CPU only: 30–60 min (mostly DistilBERT fine-tuning)
- GPU: 5–10 min

## Copy artifacts into the Node server

After training finishes:

```
copy_artifacts.bat
```

Drops files into `src/ml/`:

```
src/ml/
  models/
    tx_classifier.onnx
    label_mapping.json
    anomaly_detector.onnx
    anomaly_config.json
  tokenizer/
    tokenizer.json
    vocab.txt
    ...
```

Then restart the Node server. The TS inference layer will detect the files
and switch from fallback (rules / local LLM) to ONNX automatically.

## Manual run (per step)

```
cd ml
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt

cd transaction_classifier
python train.py          # fine-tune DistilBERT
python export_onnx.py    # produces tx_classifier.onnx
python evaluate.py       # sanity-check predictions

cd ..\anomaly_detector
python generate_synthetic.py
python train.py
python export_onnx.py
```

## Expanding the training data

`transaction_classifier/data/transactions.csv` ships with ~130 rows.
For production accuracy aim for **500+ rows**, especially on disambiguating
edge cases:

- Shell/Petronas: petrol (RM80–200) vs convenience kedai (RM10–40)
- Grab: ride vs food (description prefix `*RIDE` vs `*FOOD`)
- Guardian: shopping_personal vs medical (amount + context)

Re-run `run_training.bat` after adding rows.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `python` not found | Install Python 3.11 with "Add to PATH" |
| `pip install` slow / hangs | Use a VPN or mirror; first run pulls ~2 GB |
| CUDA out of memory | Lower `per_device_train_batch_size` in `train.py` (16 → 8) |
| ONNX export warns about opset | Safe to ignore at opset 14/15 |
| Classifier accuracy <80% | Add more rows for the failing categories |
