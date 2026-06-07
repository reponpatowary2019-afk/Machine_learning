"""
data_generator.py
Generates a realistic synthetic customer transactional dataset.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

np.random.seed(42)

N_CUSTOMERS = 800
N_TRANSACTIONS = 12000

REFERENCE_DATE = datetime(2024, 12, 31)

# Define 4 latent customer personas
# Each row: [freq_mean, freq_std, spend_mean, spend_std, recency_days_mean, recency_std, cat_pref]
PERSONAS = {
    "premium":   {"n": 120, "freq": (24, 6),  "spend": (280, 80),  "recency": (20, 15),  "n_cats": (5, 1)},
    "regular":   {"n": 380, "freq": (10, 3),  "spend": (85, 30),   "recency": (60, 30),  "n_cats": (3, 1)},
    "economy":   {"n": 200, "freq": (5,  2),  "spend": (35, 15),   "recency": (120, 40), "n_cats": (2, 1)},
    "churned":   {"n": 100, "freq": (2,  1),  "spend": (50, 40),   "recency": (280, 60), "n_cats": (2, 1)},
}

CATEGORIES = ["Electronics", "Fashion", "Groceries", "Home", "Beauty", "Sports", "Books", "Travel"]

records = []
customer_id = 1

for persona_name, cfg in PERSONAS.items():
    for _ in range(cfg["n"]):
        freq = max(1, int(np.random.normal(*cfg["freq"])))
        n_cats = max(1, min(8, int(np.random.normal(*cfg["n_cats"]))))
        preferred_cats = np.random.choice(CATEGORIES, size=n_cats, replace=False)

        # Spread transactions over the past year
        recency = max(1, int(np.random.normal(*cfg["recency"])))
        last_purchase = REFERENCE_DATE - timedelta(days=recency)
        purchase_dates = sorted([
            last_purchase - timedelta(days=np.random.exponential(scale=365/freq))
            for _ in range(freq)
        ])

        for date in purchase_dates:
            spend = max(5, np.random.normal(*cfg["spend"]))
            cat = np.random.choice(preferred_cats)
            records.append({
                "customer_id": customer_id,
                "transaction_date": date.strftime("%Y-%m-%d"),
                "amount": round(spend, 2),
                "category": cat,
                "persona": persona_name  # ground truth (not used in clustering)
            })
        customer_id += 1

df = pd.DataFrame(records)
os.makedirs("data", exist_ok=True)
df.to_csv("data/transactions.csv", index=False)
print(f"Generated {len(df)} transactions for {df['customer_id'].nunique()} customers")
print(df.head())
print("\nPersona distribution in raw data:")
print(df.groupby("persona")["customer_id"].nunique())
