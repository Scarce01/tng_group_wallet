import torch, os
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from pathlib import Path

MODEL = "models/distilbert-tx-classifier"
OUT_ONNX = "models/tx_classifier.onnx"
os.makedirs("models/tokenizer", exist_ok=True)

tok = DistilBertTokenizer.from_pretrained(MODEL)
model = DistilBertForSequenceClassification.from_pretrained(MODEL); model.eval()
dummy = tok("test [SEP] test [SEP] RM10 [SEP] hour:12",
            return_tensors="pt", max_length=64, padding="max_length", truncation=True)

torch.onnx.export(
    model, (dummy["input_ids"], dummy["attention_mask"]), OUT_ONNX,
    input_names=["input_ids", "attention_mask"], output_names=["logits"],
    dynamic_axes={"input_ids": {0: "b"}, "attention_mask": {0: "b"}, "logits": {0: "b"}},
    opset_version=14,
)
tok.save_pretrained("models/tokenizer")
size_mb = Path(OUT_ONNX).stat().st_size / 1e6
print(f"Done: {OUT_ONNX} ({size_mb:.1f}MB)")
