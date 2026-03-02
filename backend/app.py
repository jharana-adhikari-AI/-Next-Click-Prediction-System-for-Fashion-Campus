"""
FastAPI Backend - Next-Click Prediction System
Loads trained models and serves prediction endpoints.
"""

import os
import json
import pickle
import numpy as np
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

# Load environment variables
load_dotenv()

# ─── Try ONNX first (lightweight), fallback to Keras ───
USE_ONNX = False
try:
    import onnxruntime as ort
    USE_ONNX = True
except ImportError:
    pass

if not USE_ONNX:
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
    from tensorflow.keras.models import load_model

from tensorflow.keras.preprocessing.sequence import pad_sequences

MODELS_DIR = "models"
MAX_SEQ_LEN = 10

# ─── Global model state ───
models = {}


# ─── Pydantic Schemas ───
class PredictionRequest(BaseModel):
    product_id: str
    sequence: Optional[List[str]] = None
    top_k: int = 5


class SimilarRequest(BaseModel):
    product_id: str
    top_k: int = 5


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


# ─── Lifespan: load models at startup ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading models...")

    with open(f"{MODELS_DIR}/markov_model.pkl", "rb") as f:
        models["markov"] = pickle.load(f)

    with open(f"{MODELS_DIR}/label_encoder.pkl", "rb") as f:
        models["label_encoder"] = pickle.load(f)

    with open(f"{MODELS_DIR}/product_embeddings.pkl", "rb") as f:
        models["embeddings"] = pickle.load(f)

    if USE_ONNX and os.path.exists(f"{MODELS_DIR}/gru_model.onnx"):
        models["gru_session"] = ort.InferenceSession(f"{MODELS_DIR}/gru_model.onnx")
        models["gru_type"] = "onnx"
        print("  GRU loaded via ONNX Runtime")
    else:
        models["gru_model"] = load_model(f"{MODELS_DIR}/gru_model.keras")
        models["gru_type"] = "keras"
        print("  GRU loaded via Keras")

    with open(f"{MODELS_DIR}/products.json", "r") as f:
        products_list = json.load(f)
        models["products"] = {str(p["id"]): p for p in products_list}
        models["products_list"] = products_list

    with open(f"{MODELS_DIR}/metadata.json", "r") as f:
        models["metadata"] = json.load(f)

    print(f"All models loaded. {len(models['products'])} products indexed.")
    yield
    print("Shutting down...")


app = FastAPI(
    title="Next-Click Prediction API",
    description="Predicts next product clicks using Markov Chain and GRU models",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Endpoints ───

@app.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": len(models) > 0, "gru_runtime": models.get("gru_type", "none")}


@app.get("/products")
def get_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    gender: Optional[str] = None,
    search: Optional[str] = None,
):
    products = models["products_list"]

    if category:
        products = [p for p in products if p.get("masterCategory") == category]
    if gender:
        products = [p for p in products if p.get("gender") == gender]
    if search:
        q = search.lower()
        products = [
            p for p in products
            if q in str(p.get("productDisplayName", "")).lower()
            or q in str(p.get("articleType", "")).lower()
            or q in str(p.get("masterCategory", "")).lower()
        ]

    total = len(products)
    start = (page - 1) * per_page
    end = start + per_page

    return {
        "products": products[start:end],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


@app.get("/products/{product_id}")
def get_product(product_id: str):
    product = models["products"].get(product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@app.get("/categories")
def get_categories():
    cats = set()
    genders = set()
    sub_cats = set()
    for p in models["products_list"]:
        if p.get("masterCategory"):
            cats.add(p["masterCategory"])
        if p.get("gender"):
            genders.add(p["gender"])
        if p.get("subCategory"):
            sub_cats.add(p["subCategory"])
    return {
        "masterCategories": sorted(cats),
        "genders": sorted(genders),
        "subCategories": sorted(sub_cats),
    }


@app.post("/predict/markov")
def predict_markov(req: PredictionRequest):
    markov = models["markov"]
    pid = req.product_id

    if pid not in markov:
        return {"model": "markov", "input_product_id": pid, "predictions": [], "status": "not_found"}

    transitions = markov[pid]
    sorted_preds = sorted(transitions.items(), key=lambda x: -x[1])[: req.top_k]

    predictions = []
    for pred_id, prob in sorted_preds:
        predictions.append({
            "product_id": pred_id,
            "probability": round(prob, 4),
            "product_info": models["products"].get(pred_id),
        })

    return {"model": "markov", "input_product_id": pid, "predictions": predictions, "status": "success"}


@app.post("/predict/gru")
def predict_gru(req: PredictionRequest):
    le = models["label_encoder"]

    sequence = req.sequence if req.sequence else [req.product_id]
    valid_seq = [pid for pid in sequence if pid in le.classes_]

    if not valid_seq:
        return {"model": "gru", "input_product_id": req.product_id, "predictions": [], "status": "not_found"}

    encoded = le.transform(valid_seq)
    padded = pad_sequences([encoded], maxlen=MAX_SEQ_LEN)

    if models["gru_type"] == "onnx":
        session = models["gru_session"]
        input_name = session.get_inputs()[0].name
        result = session.run(None, {input_name: padded.astype(np.int32)})
        probs = result[0][0]
    else:
        probs = models["gru_model"].predict(padded, verbose=0)[0]

    top_k_indices = probs.argsort()[-req.top_k :][::-1]
    top_k_ids = le.inverse_transform(top_k_indices)

    predictions = []
    for idx, pred_id in zip(top_k_indices, top_k_ids):
        predictions.append({
            "product_id": pred_id,
            "probability": round(float(probs[idx]), 4),
            "product_info": models["products"].get(pred_id),
        })

    return {"model": "gru", "input_product_id": req.product_id, "predictions": predictions, "status": "success"}


@app.post("/similar")
def get_similar_products(req: SimilarRequest):
    embeddings = models["embeddings"]
    pid = req.product_id

    if pid not in embeddings:
        return {"input_product_id": pid, "similar_products": [], "status": "not_found"}

    target_vec = np.array(embeddings[pid])
    target_norm = np.linalg.norm(target_vec)

    similarities = {}
    for other_pid, vec in embeddings.items():
        if other_pid == pid:
            continue
        other_vec = np.array(vec)
        cos_sim = np.dot(target_vec, other_vec) / (target_norm * np.linalg.norm(other_vec) + 1e-8)
        similarities[other_pid] = float(cos_sim)

    top_similar = sorted(similarities.items(), key=lambda x: -x[1])[: req.top_k]

    similar_products = []
    for sim_id, score in top_similar:
        similar_products.append({
            "product_id": sim_id,
            "similarity": round(score, 4),
            "product_info": models["products"].get(sim_id),
        })

    return {"input_product_id": pid, "similar_products": similar_products, "status": "success"}


@app.get("/model-info")
def get_model_info():
    return models["metadata"]


@app.post("/contact")
def send_contact_email(req: ContactRequest):
    """Send contact form email via Gmail SMTP"""
    try:
        # Email configuration from environment variables
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        contact_email = os.getenv("CONTACT_EMAIL", smtp_user)

        if not smtp_user or not smtp_pass:
            raise HTTPException(500, "Email service not configured")

        # Create email message
        msg = MIMEMultipart("alternative")
        msg["From"] = smtp_user
        msg["To"] = contact_email
        msg["Subject"] = f"Contact Form: {req.subject}"
        msg["Reply-To"] = req.email

        # Email body (plain text and HTML)
        text_body = f"""
New Contact Form Submission

From: {req.name}
Email: {req.email}
Subject: {req.subject}

Message:
{req.message}

---
Sent from Fashion Campus Next-Click Prediction System
        """

        html_body = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
        New Contact Form Submission
      </h2>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>From:</strong> {req.name}</p>
        <p><strong>Email:</strong> <a href="mailto:{req.email}">{req.email}</a></p>
        <p><strong>Subject:</strong> {req.subject}</p>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="color: #333;">Message:</h3>
        <p style="background-color: #fff; padding: 15px; border-left: 4px solid #4F46E5; white-space: pre-wrap;">{req.message}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #888; font-size: 12px; text-align: center;">
        Sent from Fashion Campus Next-Click Prediction System
      </p>
    </div>
  </body>
</html>
        """

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        return {
            "status": "success",
            "message": "Email sent successfully"
        }

    except smtplib.SMTPException as e:
        raise HTTPException(500, f"Failed to send email: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
