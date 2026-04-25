import onnxruntime as ort, numpy as np, json
from transformers import DistilBertTokenizer

sess = ort.InferenceSession("models/tx_classifier.onnx")
tok = DistilBertTokenizer.from_pretrained("models/distilbert-tx-classifier")
i2l = {int(k): v for k, v in json.load(open("models/distilbert-tx-classifier/label_mapping.json"))["id2label"].items()}

tests = [
    ("GRAB*RIDE A-3892", "Grab", 45, 14),
    ("GRAB*FOOD NASI LEMAK", "GrabFood", 18, 12),
    ("SHELL PANTAI CENANG", "Shell", 180, 15),
    ("SHELL MINI MART", "Shell", 22, 13),
    ("PETRONAS JALAN SULTAN", "Petronas", 120, 9),
    ("PETRONAS MESRA KEDAI", "Petronas", 25, 13),
    ("99 SPEEDMART", "99 Speedmart", 48, 16),
    ("AGODA*BOOKING", "Agoda", 1800, 22),
    ("PLUS TOLL", "PLUS", 12, 7),
    ("STR BANTUAN", "Jabatan Kebajikan", 500, 10),
    ("TNB BILL", "TNB", 186, 10),
    ("GUARDIAN PHARMACY", "Guardian", 65, 14),
]

for d, m, a, h in tests:
    t = f"{d} [SEP] {m} [SEP] RM{a} [SEP] hour:{h}"
    e = tok(t, return_tensors="np", max_length=64, padding="max_length", truncation=True)
    lo = sess.run(None, {
        "input_ids": e["input_ids"].astype(np.int64),
        "attention_mask": e["attention_mask"].astype(np.int64),
    })[0][0]
    p = np.exp(lo) / np.sum(np.exp(lo))
    i = int(np.argmax(p))
    print(f"{d:<35} -> {i2l[i]:<25} ({p[i]:.0%})")
