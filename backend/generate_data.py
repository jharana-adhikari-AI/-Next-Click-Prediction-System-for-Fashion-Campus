"""
Synthetic Clickstream Data Generator
Generates realistic click session data using the real product.csv catalog.
"""

import pandas as pd
import numpy as np
import uuid
import json
import random
from datetime import datetime, timedelta


def _generate_event_sequence(length):
    """Generate a realistic event sequence following an e-commerce funnel."""
    sequence = ["HOMEPAGE"]
    for i in range(1, length):
        if i < length - 1:
            event = random.choices(
                ["PRODUCT_VIEW", "ITEM_DETAIL", "SCROLL", "SEARCH", "CLICK"],
                weights=[0.35, 0.20, 0.15, 0.10, 0.20],
            )[0]
        else:
            event = random.choices(
                ["ADD_TO_CART", "PRODUCT_VIEW", "SCROLL", "BOOKING"],
                weights=[0.35, 0.30, 0.20, 0.15],
            )[0]
        sequence.append(event)
    return sequence


def generate_clickstream(product_df, num_sessions=8000, seed=42):
    """
    Generate synthetic clickstream data from real product catalog.

    Sessions have 3-20 events with category affinity (70% same category).
    Only product-interaction events get event_metadata with product_id.
    """
    np.random.seed(seed)
    random.seed(seed)

    product_ids = product_df["id"].astype(str).values
    category_to_products = (
        product_df.groupby("masterCategory")["id"]
        .apply(lambda x: x.astype(str).tolist())
        .to_dict()
    )
    category_names = list(category_to_products.keys())

    all_events = []

    for _ in range(num_sessions):
        session_id = str(uuid.uuid4())
        num_events = min(max(int(np.random.lognormal(1.5, 0.6)), 3), 20)
        traffic_source = np.random.choice(["MOBILE", "WEB"], p=[0.895, 0.105])

        primary_cat = random.choice(category_names)

        base_time = datetime(2019, 1, 1) + timedelta(
            days=random.randint(0, 1000),
            hours=random.randint(8, 23),
            minutes=random.randint(0, 59),
        )

        event_sequence = _generate_event_sequence(num_events)

        for i, event_name in enumerate(event_sequence):
            event_time = base_time + timedelta(
                seconds=random.randint(10, 300) * (i + 1)
            )
            event_id = str(uuid.uuid4())

            if event_name in ("PRODUCT_VIEW", "ITEM_DETAIL", "ADD_TO_CART", "CLICK"):
                if random.random() < 0.7:
                    pid = random.choice(category_to_products[primary_cat])
                else:
                    pid = random.choice(product_ids)

                metadata = json.dumps(
                    {
                        "product_id": int(pid),
                        "quantity": random.randint(1, 5),
                        "item_price": random.randint(50000, 500000),
                    }
                )
            else:
                metadata = None

            all_events.append(
                {
                    "session_id": session_id,
                    "event_name": event_name,
                    "event_time": event_time.isoformat() + "+00:00",
                    "event_id": event_id,
                    "traffic_source": traffic_source,
                    "event_metadata": metadata,
                }
            )

    return pd.DataFrame(all_events)


if __name__ == "__main__":
    product_df = pd.read_csv("data/product.csv", on_bad_lines="skip")
    print(f"Loaded {len(product_df)} products")

    click_df = generate_clickstream(product_df, num_sessions=8000)
    print(f"Generated {len(click_df)} events across {click_df['session_id'].nunique()} sessions")

    click_df.to_csv("data/synthetic_clickstream.csv", index=False)
    print("Saved to data/synthetic_clickstream.csv")
