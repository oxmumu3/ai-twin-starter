"""Read-only helper to aggregate D7 net revenue and ROI per channel from channel_weekly_metrics.csv."""
import csv
import json
from collections import defaultdict
from pathlib import Path


def summarize_channels(csv_path=None):
    target = Path(csv_path) if csv_path else Path(__file__).resolve().parents[1] / "data" / "channel_weekly_metrics.csv"
    agg = defaultdict(lambda: {"spend_cny": 0.0, "new_paid_users": 0, "net_rev": 0.0, "gross_rev": 0.0, "refund_cny": 0.0})
    with target.open("r", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            ch = row["channel"]
            spend = float(row["spend_cny"])
            gross = float(row["d7_gross_revenue_cny"])
            refund = float(row["d7_refund_cny"])
            agg[ch]["spend_cny"] += spend
            agg[ch]["new_paid_users"] += int(row["new_paid_users"])
            agg[ch]["gross_rev"] += gross
            agg[ch]["refund_cny"] += refund
            agg[ch]["net_rev"] += gross - refund
    result = {}
    for ch, vals in sorted(agg.items()):
        roi = round(vals["net_rev"] / vals["spend_cny"], 4) if vals["spend_cny"] > 0 else 0.0
        result[ch] = {
            "spend_cny": int(vals["spend_cny"]),
            "new_paid_users": vals["new_paid_users"],
            "net_d7_revenue_cny": int(vals["net_rev"]),
            "d7_net_roi": roi,
        }
    return result


if __name__ == "__main__":
    print(json.dumps(summarize_channels(), ensure_ascii=False, indent=2))
