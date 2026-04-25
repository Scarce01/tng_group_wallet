import pandas as pd, numpy as np, random, os
from datetime import datetime, timedelta

random.seed(42); np.random.seed(42)
os.makedirs("data", exist_ok=True)

M = {
    "food":     [("Mamak", 25, 150), ("KFC", 20, 50), ("McDonald", 15, 40), ("Starbucks", 12, 30)],
    "accom":    [("Agoda", 200, 700), ("Booking", 250, 900), ("Airbnb", 200, 800)],
    "petrol":   [("Shell", 50, 200), ("Petronas", 50, 200)],
    "ride":     [("Grab", 10, 60), ("MyCar", 10, 50)],
    "activity": [("Cable Car", 30, 200), ("Cinema", 30, 80)],
    "shop":     [("Duty Free", 20, 350), ("Watsons", 15, 100)],
    "grocery":  [("99SM", 15, 80), ("MyDin", 30, 200), ("Lotus", 30, 250)],
}


def gen(pid, members=4, days=4, budget=5000, anomalies=3):
    rows = []
    start = datetime(2026, 5, 15)
    for d in range(days):
        dt = start + timedelta(days=d)
        for _ in range(random.randint(4, 10)):
            cat = random.choice(list(M.keys()))
            name, lo, hi = random.choice(M[cat])
            rows.append({
                "amount": round(random.uniform(lo, hi), 2),
                "created_at": dt.replace(hour=random.choice([8, 10, 12, 14, 18, 20]),
                                         minute=random.randint(0, 59)),
                "category": cat,
                "recipient_id": name.lower(),
                "user_id": f"u{random.randint(0, members - 1)}",
                "pool_id": pid,
                "is_anomaly": False,
            })
    for _ in range(anomalies):
        dt = start + timedelta(days=random.randint(0, days - 1))
        t = random.choice(["big", "night", "burst", "new"])
        if t == "big":
            rows.append({"amount": round(random.uniform(1500, 3000), 2),
                         "created_at": dt.replace(hour=14, minute=random.randint(0, 59)),
                         "category": "other", "recipient_id": "sus",
                         "user_id": "u0", "pool_id": pid, "is_anomaly": True})
        elif t == "night":
            rows.append({"amount": round(random.uniform(200, 800), 2),
                         "created_at": dt.replace(hour=3, minute=random.randint(0, 59)),
                         "category": "other", "recipient_id": f"unk{random.randint(100, 999)}",
                         "user_id": "u0", "pool_id": pid, "is_anomaly": True})
        elif t == "burst":
            for j in range(4):
                rows.append({"amount": round(random.uniform(100, 500), 2),
                             "created_at": dt.replace(hour=14, minute=j * 5),
                             "category": "shop", "recipient_id": f"burst{j}",
                             "user_id": "u0", "pool_id": pid, "is_anomaly": True})
        elif t == "new":
            rows.append({"amount": round(random.uniform(800, 2000), 2),
                         "created_at": dt.replace(hour=15, minute=random.randint(0, 59)),
                         "category": "other", "recipient_id": f"new{random.randint(1000, 9999)}",
                         "user_id": "u0", "pool_id": pid, "is_anomaly": True})
    return pd.DataFrame(rows).sort_values("created_at").reset_index(drop=True)


all_p = pd.concat(
    [gen(f"p{i}", random.randint(2, 8), random.randint(2, 14),
         random.uniform(1000, 20000), random.randint(1, 5)) for i in range(20)],
    ignore_index=True,
)
all_p["created_at"] = pd.to_datetime(all_p["created_at"])
all_p.to_csv("data/synthetic_transactions.csv", index=False)
print(f"{len(all_p)} tx, {all_p['is_anomaly'].sum()} anomalies ({all_p['is_anomaly'].mean():.1%})")
