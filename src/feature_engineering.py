"""
feature_engineering.py
Transforms raw transactions into a rich RFM+ feature matrix.

Unique approach:
  - Spending Volatility (CV): coefficient of variation captures erratic vs. steady buyers
  - Category Entropy: Shannon entropy of category distribution — measures shopping breadth
  - Trend Score: linear regression slope of monthly spend — rising vs. declining customers
"""

import pandas as pd
import numpy as np
from scipy.stats import entropy as scipy_entropy
from scipy.stats import linregress
import os

REFERENCE_DATE = pd.Timestamp("2024-12-31")


def compute_rfm_plus(df: pd.DataFrame) -> pd.DataFrame:
    df["transaction_date"] = pd.to_datetime(df["transaction_date"])

    features = []

    for cid, group in df.groupby("customer_id"):
        group = group.sort_values("transaction_date")

        # --- Core RFM ---
        recency = (REFERENCE_DATE - group["transaction_date"].max()).days
        frequency = len(group)
        monetary = group["amount"].sum()
        avg_order_value = group["amount"].mean()

        # --- Spending Volatility ---
        spend_cv = group["amount"].std() / (group["amount"].mean() + 1e-9)

        # --- Category Entropy (Shannon) ---
        cat_counts = group["category"].value_counts(normalize=True)
        cat_entropy = scipy_entropy(cat_counts)

        # --- Number of distinct categories ---
        n_categories = group["category"].nunique()

        # --- Trend Score: slope of monthly spending ---
        monthly = group.set_index("transaction_date").resample("ME")["amount"].sum().reset_index()
        monthly["month_idx"] = range(len(monthly))
        if len(monthly) >= 3:
            slope, _, _, _, _ = linregress(monthly["month_idx"], monthly["amount"])
        else:
            slope = 0.0

        # --- Inter-purchase gap stats ---
        if len(group) >= 2:
            gaps = group["transaction_date"].diff().dt.days.dropna()
            avg_gap = gaps.mean()
            gap_std = gaps.std()
        else:
            avg_gap = recency
            gap_std = 0.0

        features.append({
            "customer_id": cid,
            "recency": recency,
            "frequency": frequency,
            "monetary": round(monetary, 2),
            "avg_order_value": round(avg_order_value, 2),
            "spend_cv": round(spend_cv, 4),
            "category_entropy": round(cat_entropy, 4),
            "n_categories": n_categories,
            "trend_score": round(slope, 4),
            "avg_purchase_gap": round(avg_gap, 2),
            "gap_std": round(gap_std if not np.isnan(gap_std) else 0.0, 2),
            # Keep ground truth for post-hoc evaluation only
            "persona": group["persona"].iloc[0]
        })

    feat_df = pd.DataFrame(features)
    return feat_df


if __name__ == "__main__":
    df = pd.read_csv("data/transactions.csv")
    feat_df = compute_rfm_plus(df)
    feat_df.to_csv("data/customer_features.csv", index=False)
    print(f"Feature matrix shape: {feat_df.shape}")
    print(feat_df.describe().round(2))
