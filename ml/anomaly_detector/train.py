import pandas as pd, numpy as np, joblib, json, os
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score
from feature_engineering import extract_features, FEATURE_NAMES

os.makedirs("models", exist_ok=True)

df = pd.read_csv("data/synthetic_transactions.csv")
df["created_at"] = pd.to_datetime(df["created_at"])

# train per-pool features then concat (so stats are pool-relative, not global)
parts = []
for pid, g in df.groupby("pool_id"):
    feats = extract_features(g, budget=5000)
    feats["is_anomaly"] = g["is_anomaly"].values
    parts.append(feats)
data = pd.concat(parts, ignore_index=True)

X = data[FEATURE_NAMES].values
y = data["is_anomaly"].astype(int).values

contam = max(y.mean(), 0.01)
model = IsolationForest(n_estimators=200, contamination=contam,
                        random_state=42, n_jobs=-1)
model.fit(X)

scores = -model.score_samples(X)          # higher = more anomalous
preds = (model.predict(X) == -1).astype(int)

print(f"Trained on {len(X)} samples ({y.sum()} anomalies, {y.mean():.1%})")
print(f"Precision: {precision_score(y, preds, zero_division=0):.3f}")
print(f"Recall:    {recall_score(y, preds, zero_division=0):.3f}")
print(f"F1:        {f1_score(y, preds, zero_division=0):.3f}")

threshold = float(np.percentile(scores, 100 * (1 - contam)))
joblib.dump(model, "models/iforest.joblib")
json.dump({
    "feature_names": FEATURE_NAMES,
    "threshold": threshold,
    "contamination": float(contam),
    "n_estimators": 200,
}, open("models/anomaly_config.json", "w"), indent=2)
print(f"Saved models/iforest.joblib and models/anomaly_config.json (threshold={threshold:.3f})")
