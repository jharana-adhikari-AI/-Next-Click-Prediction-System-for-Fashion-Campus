"""
Synthetic Clickstream Data Generator
Generates realistic click session data using the real product.csv catalog.
ENSURES 100% product coverage - every product appears in at least one session.
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


def _create_session_events(session_id, product_batch, category_to_products, primary_cat, all_product_ids, base_time, traffic_source):
    """Create events for a single session. GUARANTEES all products in the batch appear."""
    events = []
    product_event_types = ["PRODUCT_VIEW", "ITEM_DETAIL", "CLICK", "ADD_TO_CART"]
    non_product_events = ["HOMEPAGE", "SCROLL", "SEARCH"]

    # Build event sequence: start with HOMEPAGE, then guarantee one product event
    # per batch item, then sprinkle in non-product events
    event_list = [("HOMEPAGE", None)]
    for pid in product_batch:
        etype = random.choice(product_event_types)
        event_list.append((etype, pid))
    # Add 0-2 extra non-product events interspersed
    for _ in range(random.randint(0, 2)):
        pos = random.randint(1, len(event_list))
        event_list.insert(pos, (random.choice(non_product_events), None))

    for i, (event_name, pid) in enumerate(event_list):
        event_time = base_time + timedelta(seconds=random.randint(10, 300) * (i + 1))
        event_id = str(uuid.uuid4())

        if pid is not None:
            metadata = json.dumps({
                "product_id": int(pid),
                "quantity": random.randint(1, 5),
                "item_price": random.randint(50000, 500000),
            })
        else:
            metadata = None

        events.append({
            "session_id": session_id,
            "event_name": event_name,
            "event_time": event_time.isoformat() + "+00:00",
            "event_id": event_id,
            "traffic_source": traffic_source,
            "event_metadata": metadata,
        })

    return events


def generate_clickstream(product_df, num_sessions=8000, seed=42):
    """
    Generate synthetic clickstream data ensuring 100% product coverage.

    Two-pass generation:
      Pass 1 (Coverage): Shuffle ALL products and batch them into sessions
             of 3-6 products each. This guarantees every product appears.
      Pass 2 (Volume):   Generate additional random sessions for natural patterns.
    """
    np.random.seed(seed)
    random.seed(seed)

    all_product_ids = product_df["id"].astype(str).values.tolist()
    category_to_products = (
        product_df.groupby("masterCategory")["id"]
        .apply(lambda x: x.astype(str).tolist())
        .to_dict()
    )
    product_to_category = dict(zip(
        product_df["id"].astype(str),
        product_df["masterCategory"],
    ))
    category_names = list(category_to_products.keys())

    all_events = []

    # ── Pass 1: Coverage sessions ──
    # Shuffle all 44K products and split into batches of 3-6
    shuffled = all_product_ids.copy()
    random.shuffle(shuffled)

    idx = 0
    coverage_count = 0
    while idx < len(shuffled):
        batch_size = random.randint(3, 6)
        batch = shuffled[idx : idx + batch_size]
        idx += batch_size

        # If last batch is too small (< 2), pad with random products
        while len(batch) < 2:
            batch.append(random.choice(all_product_ids))

        session_id = str(uuid.uuid4())
        primary_cat = product_to_category.get(batch[0], random.choice(category_names))
        traffic_source = np.random.choice(["MOBILE", "WEB"], p=[0.895, 0.105])
        base_time = datetime(2019, 1, 1) + timedelta(
            days=random.randint(0, 1000),
            hours=random.randint(8, 23),
            minutes=random.randint(0, 59),
        )

        events = _create_session_events(
            session_id, batch, category_to_products, primary_cat,
            all_product_ids, base_time, traffic_source
        )
        all_events.extend(events)
        coverage_count += 1

    print(f"    Coverage pass: {coverage_count} sessions (all {len(all_product_ids)} products included)")

    # ── Pass 2: Additional random sessions ──
    extra_sessions = max(0, num_sessions - coverage_count)
    for _ in range(extra_sessions):
        session_id = str(uuid.uuid4())
        primary_cat = random.choice(category_names)
        traffic_source = np.random.choice(["MOBILE", "WEB"], p=[0.895, 0.105])
        base_time = datetime(2019, 1, 1) + timedelta(
            days=random.randint(0, 1000),
            hours=random.randint(8, 23),
            minutes=random.randint(0, 59),
        )

        # Pick 2-8 products with category affinity
        batch = []
        for _ in range(random.randint(2, 8)):
            if random.random() < 0.7:
                pid = random.choice(category_to_products[primary_cat])
            else:
                pid = random.choice(all_product_ids)
            batch.append(pid)

        events = _create_session_events(
            session_id, batch, category_to_products, primary_cat,
            all_product_ids, base_time, traffic_source
        )
        all_events.extend(events)

    print(f"    Random pass: {extra_sessions} additional sessions")
    return pd.DataFrame(all_events)


if __name__ == "__main__":
    product_df = pd.read_csv("data/product.csv", on_bad_lines="skip")
    print(f"Loaded {len(product_df)} products")

    click_df = generate_clickstream(product_df, num_sessions=20000)
    print(f"Generated {len(click_df)} events across {click_df['session_id'].nunique()} sessions")

    click_df.to_csv("data/synthetic_clickstream.csv", index=False)
    print("Saved to data/synthetic_clickstream.csv")
