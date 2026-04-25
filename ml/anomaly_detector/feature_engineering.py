import pandas as pd, numpy as np
from datetime import timedelta

FEATURE_NAMES = [
    "amount_vs_pool_avg", "amount_vs_user_avg", "amount_vs_category_avg",
    "hour_normalized", "day_of_week_normalized", "is_weekend",
    "hours_since_last_tx", "recipient_frequency", "is_new_recipient",
    "daily_cumulative_pct", "total_spent_pct", "log_amount", "tx_velocity_2h",
]


def extract_features(df: pd.DataFrame, budget: float) -> pd.DataFrame:
    df = df.copy().sort_values("created_at").reset_index(drop=True)
    f = pd.DataFrame(index=df.index)
    pa = df["amount"].mean() if len(df) else 1.0

    f["amount_vs_pool_avg"] = df["amount"] / max(pa, 1)
    f["amount_vs_user_avg"] = df["amount"] / df.groupby("user_id")["amount"].transform("mean").clip(lower=1)
    f["amount_vs_category_avg"] = df["amount"] / df.groupby("category")["amount"].transform("mean").clip(lower=1)
    f["hour_normalized"] = df["created_at"].dt.hour / 23
    f["day_of_week_normalized"] = df["created_at"].dt.dayofweek / 6
    f["is_weekend"] = (df["created_at"].dt.dayofweek >= 5).astype(float)
    f["hours_since_last_tx"] = df["created_at"].diff().dt.total_seconds().fillna(0).clip(upper=604800) / 604800
    f["recipient_frequency"] = df.groupby("recipient_id")["recipient_id"].transform("count") / max(len(df), 1)

    seen = set(); new = []
    for r in df["recipient_id"]:
        new.append(1.0 if r not in seen else 0.0)
        seen.add(r)
    f["is_new_recipient"] = new

    f["daily_cumulative_pct"] = df.groupby(df["created_at"].dt.date)["amount"].cumsum() / max(budget, 1)
    f["total_spent_pct"] = df["amount"].cumsum() / max(budget, 1)
    f["log_amount"] = np.log1p(df["amount"])

    vel = []
    for _, row in df.iterrows():
        w = row["created_at"] - timedelta(hours=2)
        vel.append(((df["created_at"] >= w) & (df["created_at"] <= row["created_at"])).sum() / 10)
    f["tx_velocity_2h"] = vel

    return f[FEATURE_NAMES].astype(float)
