"""
Training Pipeline - Trains all models and saves artifacts as pickle/ONNX files.

Models trained:
  1. Word2Vec product embeddings
  2. Markov Chain transition probabilities
  3. GRU deep learning model (saved as ONNX)
  4. LabelEncoder for product ID encoding
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from collections import defaultdict
from gensim.models import Word2Vec
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, GRU, Dense
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.preprocessing.sequence import pad_sequences
import tensorflow as tf

# ─── Configuration ───
MODELS_DIR = "models"
DATA_DIR = "data"
W2V_VECTOR_SIZE = 64
W2V_WINDOW = 5
GRU_UNITS = 64
GRU_EMBEDDING_DIM = 64
MAX_SEQ_LEN = 10
BATCH_SIZE = 64
EPOCHS = 10
NUM_SESSIONS = 8000
RANDOM_SEED = 42


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    # ── Step 1: Load product catalog ──
    print("Step 1: Loading product catalog...")
    product_df = pd.read_csv(f"{DATA_DIR}/product.csv", on_bad_lines="skip")
    print(f"  Loaded {len(product_df)} products")

    products_list = product_df.fillna("").to_dict(orient="records")
    with open(f"{MODELS_DIR}/products.json", "w") as f:
        json.dump(products_list, f)
    print(f"  Saved products.json ({len(products_list)} entries)")

    # ── Step 2: Generate synthetic clickstream ──
    print("\nStep 2: Generating synthetic clickstream data...")
    from generate_data import generate_clickstream

    click_df = generate_clickstream(product_df, num_sessions=NUM_SESSIONS, seed=RANDOM_SEED)
    print(f"  Generated {len(click_df)} events across {click_df['session_id'].nunique()} sessions")

    # ── Step 3: Extract product-only click sequences ──
    print("\nStep 3: Extracting click sequences...")
    click_df["product_id"] = click_df["event_metadata"].apply(
        lambda x: str(json.loads(x)["product_id"]) if pd.notna(x) else None
    )
    product_clicks = click_df.dropna(subset=["product_id"])

    click_sequences = (
        product_clicks.sort_values(["session_id", "event_time"])
        .groupby("session_id")["product_id"]
        .apply(list)
        .tolist()
    )
    click_sequences = [seq for seq in click_sequences if len(seq) >= 2]
    print(f"  Extracted {len(click_sequences)} valid sequences (min 2 products each)")

    # ── Step 4: Train Word2Vec ──
    print("\nStep 4: Training Word2Vec...")
    w2v_model = Word2Vec(
        sentences=click_sequences,
        vector_size=W2V_VECTOR_SIZE,
        window=W2V_WINDOW,
        min_count=1,
        workers=4,
        seed=RANDOM_SEED,
    )
    w2v_model.save(f"{MODELS_DIR}/word2vec.model")

    product_embeddings = {
        pid: w2v_model.wv[pid].tolist() for pid in w2v_model.wv.index_to_key
    }
    with open(f"{MODELS_DIR}/product_embeddings.pkl", "wb") as f:
        pickle.dump(product_embeddings, f)
    print(f"  Word2Vec vocabulary: {len(w2v_model.wv)} products")

    # ── Step 5: Build Markov Chain ──
    print("\nStep 5: Building Markov Chain...")
    markov_counts = defaultdict(lambda: defaultdict(int))
    for seq in click_sequences:
        for i in range(len(seq) - 1):
            markov_counts[seq[i]][seq[i + 1]] += 1

    markov_dict = {}
    for curr in markov_counts:
        total = sum(markov_counts[curr].values())
        markov_dict[curr] = {
            nxt: count / total for nxt, count in markov_counts[curr].items()
        }

    with open(f"{MODELS_DIR}/markov_model.pkl", "wb") as f:
        pickle.dump(markov_dict, f)
    print(f"  Markov states: {len(markov_dict)}")

    # ── Step 6: Encode labels ──
    print("\nStep 6: Encoding product labels...")
    label_encoder = LabelEncoder()
    label_encoder.fit(list(w2v_model.wv.index_to_key))

    with open(f"{MODELS_DIR}/label_encoder.pkl", "wb") as f:
        pickle.dump(label_encoder, f)
    print(f"  Label classes: {len(label_encoder.classes_)}")

    # ── Step 7: Prepare GRU training data ──
    print("\nStep 7: Preparing GRU training data...")
    encoded_sequences = []
    for seq in click_sequences:
        if all(pid in label_encoder.classes_ for pid in seq):
            encoded_sequences.append(label_encoder.transform(seq))

    X, y = [], []
    for seq in encoded_sequences:
        for i in range(1, len(seq)):
            X.append(seq[:i])
            y.append(seq[i])

    X = pad_sequences(X, maxlen=MAX_SEQ_LEN)
    y = np.array(y)
    print(f"  Training samples: {X.shape[0]}, Classes: {len(label_encoder.classes_)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RANDOM_SEED
    )

    # ── Step 8: Train GRU ──
    print("\nStep 8: Training GRU model...")
    num_classes = len(label_encoder.classes_)

    gru_model = Sequential(
        [
            Embedding(input_dim=num_classes, output_dim=GRU_EMBEDDING_DIM, input_length=MAX_SEQ_LEN),
            GRU(GRU_UNITS),
            Dense(num_classes, activation="softmax"),
        ]
    )
    gru_model.compile(
        optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"]
    )

    early_stop = EarlyStopping(monitor="val_loss", patience=2, restore_best_weights=True)

    history = gru_model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_data=(X_test, y_test),
        callbacks=[early_stop],
        verbose=1,
    )

    # Save as Keras format
    gru_model.save(f"{MODELS_DIR}/gru_model.keras")
    print("  GRU model saved (Keras format)")

    # Convert to ONNX for lightweight deployment
    try:
        import tf2onnx
        import onnx

        spec = (tf.TensorSpec((None, MAX_SEQ_LEN), tf.int32, name="input"),)
        onnx_model, _ = tf2onnx.convert.from_keras(gru_model, input_signature=spec)
        onnx.save(onnx_model, f"{MODELS_DIR}/gru_model.onnx")
        print("  GRU model also saved as ONNX")
    except ImportError:
        print("  tf2onnx not installed - skipping ONNX conversion")
        print("  Install with: pip install tf2onnx onnx")

    # ── Step 9: Evaluate models ──
    print("\nStep 9: Evaluating models...")

    # GRU evaluation
    y_pred_probs = gru_model.predict(X_test, verbose=0)
    y_pred_top1 = np.argmax(y_pred_probs, axis=1)
    gru_top1_acc = float(np.mean(y_pred_top1 == y_test))

    top3_correct = 0
    for i in range(len(y_test)):
        top3 = y_pred_probs[i].argsort()[-3:][::-1]
        if y_test[i] in top3:
            top3_correct += 1
    gru_top3_acc = top3_correct / len(y_test)

    # Markov evaluation
    markov_top1_correct = 0
    markov_top3_correct = 0
    markov_total = 0

    for seq in click_sequences:
        for i in range(len(seq) - 1):
            current, actual_next = seq[i], seq[i + 1]
            if current not in markov_dict:
                continue
            sorted_preds = sorted(markov_dict[current].items(), key=lambda x: -x[1])[:3]
            pred_ids = [pid for pid, _ in sorted_preds]

            markov_total += 1
            if pred_ids and actual_next == pred_ids[0]:
                markov_top1_correct += 1
            if actual_next in pred_ids:
                markov_top3_correct += 1

    markov_top1_acc = markov_top1_correct / markov_total if markov_total else 0
    markov_top3_acc = markov_top3_correct / markov_total if markov_total else 0

    print(f"  Markov - Top-1: {markov_top1_acc:.4f}, Top-3: {markov_top3_acc:.4f}")
    print(f"  GRU    - Top-1: {gru_top1_acc:.4f}, Top-3: {gru_top3_acc:.4f}")

    # ── Step 10: Save metadata ──
    metadata = {
        "num_products": len(product_df),
        "num_sessions": len(click_sequences),
        "num_training_samples": int(X.shape[0]),
        "num_classes": num_classes,
        "max_seq_len": MAX_SEQ_LEN,
        "w2v_vector_size": W2V_VECTOR_SIZE,
        "gru_units": GRU_UNITS,
        "markov_states": len(markov_dict),
        "markov_accuracy": {"top1": round(markov_top1_acc, 4), "top3": round(markov_top3_acc, 4)},
        "gru_accuracy": {"top1": round(gru_top1_acc, 4), "top3": round(gru_top3_acc, 4)},
        "gru_val_accuracy": round(float(history.history["val_accuracy"][-1]), 4),
        "gru_val_loss": round(float(history.history["val_loss"][-1]), 4),
    }

    with open(f"{MODELS_DIR}/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 50)
    print("TRAINING COMPLETE")
    print("=" * 50)
    print(f"Models saved to {MODELS_DIR}/")
    print(f"  - markov_model.pkl ({os.path.getsize(f'{MODELS_DIR}/markov_model.pkl') / 1024:.0f} KB)")
    print(f"  - product_embeddings.pkl ({os.path.getsize(f'{MODELS_DIR}/product_embeddings.pkl') / 1024:.0f} KB)")
    print(f"  - label_encoder.pkl ({os.path.getsize(f'{MODELS_DIR}/label_encoder.pkl') / 1024:.0f} KB)")
    print(f"  - gru_model.keras ({os.path.getsize(f'{MODELS_DIR}/gru_model.keras') / 1024:.0f} KB)")
    print(f"  - products.json ({os.path.getsize(f'{MODELS_DIR}/products.json') / 1024:.0f} KB)")
    print(f"  - metadata.json")


if __name__ == "__main__":
    main()
