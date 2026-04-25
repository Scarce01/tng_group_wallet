import pandas as pd, numpy as np, json, torch, os
from torch.utils.data import Dataset
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, TrainingArguments, Trainer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

MODEL_NAME = "distilbert-base-uncased"
OUTPUT = "models/distilbert-tx-classifier"
os.makedirs(OUTPUT, exist_ok=True)

df = pd.read_csv("data/transactions.csv")
cats = json.load(open("data/categories.json"))["categories"]
c2i = {c: i for i, c in enumerate(cats)}
i2c = {i: c for c, i in c2i.items()}
df["label"] = df["category"].map(c2i)
if df["label"].isna().any():
    bad = df[df["label"].isna()]["category"].unique().tolist()
    raise ValueError(f"Unknown categories in CSV: {bad}")
df["text"] = (df["description"].fillna("") + " [SEP] " + df["merchant_name"].fillna("")
              + " [SEP] RM" + df["amount"].astype(str)
              + " [SEP] hour:" + df["hour"].astype(str))

# stratify only when every class has >=2 rows AND test split fits all classes
n_classes = len(cats)
test_size = max(0.15, n_classes / len(df) + 0.02)  # ensure test >= n_classes
can_stratify = df["label"].value_counts().min() >= 2 and int(len(df) * test_size) >= n_classes
strat = df["label"] if can_stratify else None
train_df, val_df = train_test_split(df, test_size=test_size, stratify=strat, random_state=42)
print(f"Split: {len(train_df)} train / {len(val_df)} val (stratified={can_stratify})")
tok = DistilBertTokenizer.from_pretrained(MODEL_NAME)

class DS(Dataset):
    def __init__(s, texts, labels):
        s.enc = tok(texts.tolist(), truncation=True, padding="max_length", max_length=64, return_tensors="pt")
        s.lab = torch.tensor(labels.tolist(), dtype=torch.long)
    def __getitem__(s, i):
        d = {k: v[i] for k, v in s.enc.items()}; d["labels"] = s.lab[i]; return d
    def __len__(s): return len(s.lab)

model = DistilBertForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=len(cats),
    id2label={i: c for i, c in enumerate(cats)},
    label2id={c: i for i, c in enumerate(cats)},
)
args = TrainingArguments(
    output_dir=OUTPUT, num_train_epochs=10, per_device_train_batch_size=16,
    learning_rate=2e-5, weight_decay=0.01,
    eval_strategy="epoch", save_strategy="epoch",
    load_best_model_at_end=True, metric_for_best_model="accuracy",
    seed=42, logging_steps=20, report_to="none",
)
trainer = Trainer(
    model=model, args=args,
    train_dataset=DS(train_df["text"], train_df["label"]),
    eval_dataset=DS(val_df["text"], val_df["label"]),
    compute_metrics=lambda p: {"accuracy": accuracy_score(p[1], np.argmax(p[0], -1))},
)
trainer.train()
trainer.save_model(OUTPUT); tok.save_pretrained(OUTPUT)
preds = np.argmax(trainer.predict(DS(val_df["text"], val_df["label"])).predictions, -1)
print(classification_report(val_df["label"].tolist(), preds, target_names=cats, zero_division=0))
json.dump({"id2label": {str(i): c for i, c in i2c.items()}, "label2id": c2i},
          open(f"{OUTPUT}/label_mapping.json", "w"), indent=2)
print(f"Saved model to {OUTPUT}")
