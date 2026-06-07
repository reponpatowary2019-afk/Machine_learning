"""
marketing_strategy.py
Reads the labeled cluster profiles and generates a structured
marketing strategy report per segment.
"""

import pandas as pd

STRATEGIES = {
    "💎 Premium": {
        "description": "High-value, frequent, and recent buyers across many categories.",
        "tactics": [
            "Invite to exclusive VIP loyalty program with early access to sales.",
            "Personalized recommendations based on cross-category purchase history.",
            "Assign dedicated account manager or personal shopper service.",
            "Send premium gift or thank-you card on anniversaries.",
        ],
        "KPIs": ["CLV (Customer Lifetime Value)", "Repeat purchase rate", "NPS score"],
        "risk": "Churn if they feel undervalued — invest in retention proactively.",
    },
    "🔁 Loyal Regular": {
        "description": "Consistent, moderate spenders with stable purchase rhythms.",
        "tactics": [
            "Points-based loyalty rewards to reinforce habitual purchasing.",
            "Bundle offers to increase average order value.",
            "Email reminders timed to their typical purchase cycle.",
            "Upsell toward premium category during seasonal peaks.",
        ],
        "KPIs": ["Frequency", "Average order value growth", "Promotion redemption rate"],
        "risk": "May switch to competitor on price — maintain competitive pricing.",
    },
    "🚪 Churned / Dormant": {
        "description": "Long since last purchase; historically low engagement.",
        "tactics": [
            "Win-back campaign: 'We miss you' email with 20–30% one-time discount.",
            "Survey to understand reasons for disengagement.",
            "Showcase new product categories they haven't explored.",
            "If no response in 90 days, move to suppression list to save costs.",
        ],
        "KPIs": ["Reactivation rate", "Campaign ROI", "Email open rate"],
        "risk": "High acquisition cost per win-back — prioritize highest-LTV churned customers.",
    },
    "⚡ Opportunistic Buyer": {
        "description": "Irregular, high-variance spend — typically triggered by promotions or seasonal events.",
        "tactics": [
            "Flash sales and limited-time offers timed to known peaks.",
            "Retargeting ads showing recently viewed items.",
            "Gamification: 'Spin to win' or mystery discount coupons.",
            "Urgency triggers: countdown timers, low-stock alerts.",
        ],
        "KPIs": ["Conversion rate on promotions", "Return rate", "Campaign click-through"],
        "risk": "Heavy discounting erodes margins — segment further by LTV before offering deep discounts.",
    },
    "💰 Budget Conscious": {
        "description": "Regular but modest spenders, price-sensitive, limited category diversity.",
        "tactics": [
            "Price-match guarantee and value bundles.",
            "Introduce private-label / own-brand alternatives.",
            "Reward every purchase (even small ones) to build habit.",
            "Expand basket via 'frequently bought together' cross-sells.",
        ],
        "KPIs": ["Basket size", "Coupon redemption", "Category expansion rate"],
        "risk": "Thin margins — focus on volume and basket growth rather than discounting.",
    },
}

def print_strategy_report():
    print("=" * 65)
    print("   CUSTOMER SEGMENT MARKETING STRATEGY REPORT")
    print("=" * 65)
    for segment, info in STRATEGIES.items():
        print(f"\n{'─'*65}")
        print(f"  SEGMENT: {segment}")
        print(f"{'─'*65}")
        print(f"  Profile: {info['description']}")
        print("\n  Recommended Marketing Tactics:")
        for i, t in enumerate(info["tactics"], 1):
            print(f"    {i}. {t}")
        print(f"\n  Key Performance Indicators: {', '.join(info['KPIs'])}")
        print(f"  ⚠ Risk: {info['risk']}")
    print("\n" + "=" * 65)

if __name__ == "__main__":
    print_strategy_report()

    # Save as CSV for the report
    rows = []
    for seg, info in STRATEGIES.items():
        rows.append({
            "Segment": seg,
            "Profile": info["description"],
            "Top Tactic 1": info["tactics"][0],
            "Top Tactic 2": info["tactics"][1],
            "KPIs": ", ".join(info["KPIs"]),
            "Risk": info["risk"],
        })
    pd.DataFrame(rows).to_csv("outputs/reports/marketing_strategies.csv", index=False)
    print("\nSaved: outputs/reports/marketing_strategies.csv")
