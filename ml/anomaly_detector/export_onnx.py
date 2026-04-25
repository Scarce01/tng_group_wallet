import joblib, json
from pathlib import Path
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

model = joblib.load("models/iforest.joblib")
cfg = json.load(open("models/anomaly_config.json"))
n = len(cfg["feature_names"])

onx = convert_sklearn(
    model,
    initial_types=[("input", FloatTensorType([None, n]))],
    target_opset={"": 15, "ai.onnx.ml": 3},
)
out = "models/anomaly_detector.onnx"
Path(out).write_bytes(onx.SerializeToString())
size_kb = Path(out).stat().st_size / 1024
print(f"Done: {out} ({size_kb:.1f}KB)")
