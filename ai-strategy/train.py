import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score

# ─────────────────────────────────────────────
# 1. Load or generate data
# ─────────────────────────────────────────────

DATA_PATH = "data/eth_prices.csv"
MODEL_PATH = "model.pkl"
SCALER_PATH = "scaler.pkl"

def load_or_generate_data():
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        print(f"Loaded {len(df)} rows from {DATA_PATH}")
    else:
        print("CSV not found. Generating synthetic data...")
        np.random.seed(42)
        n = 730
        dates = pd.date_range("2022-01-01", periods=n, freq="D")
        price = 3000.0
        prices = [price]
        for _ in range(n - 1):
            r = np.random.normal(0.001, 0.035)
            price = max(500, min(6000, price * (1 + r)))
            prices.append(round(price, 2))
        df = pd.DataFrame({"date": dates, "price": prices})
        os.makedirs("data", exist_ok=True)
        df.to_csv(DATA_PATH, index=False)
    return df

# ─────────────────────────────────────────────
# 2. Feature Engineering
# ─────────────────────────────────────────────

def engineer_features(df):
    df = df.copy()
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["price"])

    # Daily returns
    df["return"] = df["price"].pct_change()

    # Volatility: 7-day and 14-day rolling std of returns
    df["volatility_7d"]  = df["return"].rolling(7).std()
    df["volatility_14d"] = df["return"].rolling(14).std()

    # Price momentum: 7-day and 14-day moving average ratio
    df["ma_7d"]  = df["price"].rolling(7).mean()
    df["ma_14d"] = df["price"].rolling(14).mean()
    df["momentum_7d"]  = df["price"] / df["ma_7d"]
    df["momentum_14d"] = df["price"] / df["ma_14d"]

    # Normalized price (relative to 30-day average)
    df["ma_30d"]          = df["price"].rolling(30).mean()
    df["price_vs_ma30"]   = df["price"] / df["ma_30d"]

    # Target: optimal strike multiplier
    # Logic: higher volatility → higher multiplier to avoid exercise
    # Base multiplier = 1.08, adjusted by volatility
    # Cap between 1.05 and 1.25
    df["strike_multiplier"] = 1.08 + (df["volatility_7d"] * 5).clip(0, 0.17)

    # Drop rows with NaN from rolling windows
    df = df.dropna()

    return df

# ─────────────────────────────────────────────
# 3. Train Model
# ─────────────────────────────────────────────

def train():
    df = load_or_generate_data()
    df = engineer_features(df)

    feature_cols = [
        "price",
        "volatility_7d",
        "volatility_14d",
        "momentum_7d",
        "momentum_14d",
        "price_vs_ma30"
    ]

    X = df[feature_cols].values
    y = df["strike_multiplier"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)
    print(f"\nModel Evaluation:")
    print(f"  MAE: {mae:.5f}")
    print(f"  R²:  {r2:.4f}")

    # Save model and scaler
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    print(f"\n✅ Model saved to {MODEL_PATH}")
    print(f"✅ Scaler saved to {SCALER_PATH}")

    # Quick sanity check
    test_input = scaler.transform([[3000, 0.03, 0.025, 1.01, 1.005, 0.99]])
    pred = model.predict(test_input)[0]
    print(f"\nSanity check — price=$3000, vol=0.03 → multiplier={pred:.4f}, strike=${3000*pred:.0f}")

    return model, scaler

if __name__ == "__main__":
    train()
