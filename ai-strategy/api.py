import pickle
import os
import numpy as np
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────

app = FastAPI(
    title="DynVault AI Strategy API",
    description="ML-powered strike price optimization for ETH covered call vault",
    version="1.0.0"
)

# CRITICAL: CORS must allow the Vite dev server origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─────────────────────────────────────────────
# Load model at startup
# ─────────────────────────────────────────────

MODEL_PATH  = "model.pkl"
SCALER_PATH = "scaler.pkl"

model  = None
scaler = None

@app.on_event("startup")
async def load_model():
    global model, scaler
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(SCALER_PATH, "rb") as f:
            scaler = pickle.load(f)
        print("✅ ML model and scaler loaded successfully")
    else:
        print("⚠️  model.pkl or scaler.pkl not found. Run train.py first.")

# ─────────────────────────────────────────────
# Response schema
# ─────────────────────────────────────────────

class PredictionResponse(BaseModel):
    recommended_strike: float
    multiplier: float
    confidence: float
    risk_level: str
    current_price: float
    volatility: float
    momentum: Optional[float] = None

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str

# ─────────────────────────────────────────────
# Helper: compute confidence score
# ─────────────────────────────────────────────

def compute_confidence(volatility: float, multiplier: float) -> float:
    """
    Confidence is inversely related to volatility.
    High volatility = less certain prediction.
    Returns a value between 0.50 and 0.95.
    """
    base = 0.95
    vol_penalty = min(volatility * 5, 0.45)
    return round(max(0.50, base - vol_penalty), 2)

def compute_risk_level(volatility: float) -> str:
    if volatility < 0.02:
        return "LOW"
    elif volatility < 0.05:
        return "MEDIUM"
    else:
        return "HIGH"

# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

@app.get("/predict", response_model=PredictionResponse)
async def predict(
    price:      float = Query(..., description="Current ETH price in USD", gt=0),
    volatility: float = Query(..., description="Market volatility (rolling std of returns)", ge=0),
    momentum:   Optional[float] = Query(None, description="Optional: price / 7d moving average ratio")
):
    if model is None or scaler is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run train.py first, then restart the API."
        )

    # Build feature vector
    # Features: [price, volatility_7d, volatility_14d, momentum_7d, momentum_14d, price_vs_ma30]
    vol_7d  = volatility
    vol_14d = volatility * 0.9   # approximate 14d from 7d
    mom_7d  = momentum if momentum is not None else 1.0
    mom_14d = momentum * 0.98 if momentum is not None else 1.0
    price_vs_ma30 = momentum * 0.97 if momentum is not None else 1.0

    features = np.array([[price, vol_7d, vol_14d, mom_7d, mom_14d, price_vs_ma30]])

    try:
        features_scaled = scaler.transform(features)
        multiplier = float(model.predict(features_scaled)[0])
        multiplier = round(max(1.05, min(1.30, multiplier)), 4)  # clamp to safe range
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    recommended_strike = round(price * multiplier, 2)
    confidence         = compute_confidence(volatility, multiplier)
    risk_level         = compute_risk_level(volatility)

    return {
        "recommended_strike": recommended_strike,
        "multiplier": multiplier,
        "confidence": confidence,
        "risk_level": risk_level,
        "current_price": price,
        "volatility": volatility,
        "momentum": momentum
    }

@app.get("/strategies")
async def get_strategies(price: float = Query(..., gt=0)):
    """
    Returns all three strategy variants for comparison.
    Useful for the backtesting panel.
    """
    strategies = [
        {"name": "Conservative", "multiplier": 1.10, "strike": round(price * 1.10, 2), "risk": "LOW"},
        {"name": "Balanced",     "multiplier": 1.08, "strike": round(price * 1.08, 2), "risk": "MEDIUM"},
        {"name": "Aggressive",   "multiplier": 1.05, "strike": round(price * 1.05, 2), "risk": "HIGH"},
    ]
    return {"price": price, "strategies": strategies}

# ─────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
