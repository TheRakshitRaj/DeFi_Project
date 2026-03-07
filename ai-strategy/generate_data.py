import pandas as pd
import numpy as np

np.random.seed(42)
n_days = 730  # 2 years of daily data

dates = pd.date_range(start="2022-01-01", periods=n_days, freq="D")

# Simulate ETH price with geometric brownian motion
price = 3000.0
prices = [price]
for _ in range(n_days - 1):
    daily_return = np.random.normal(0.001, 0.035)
    price = price * (1 + daily_return)
    price = max(500, min(6000, price))  # clamp between $500-$6000
    prices.append(round(price, 2))

df = pd.DataFrame({"date": dates, "price": prices})
df.to_csv("data/eth_prices.csv", index=False)
print(f"Generated {n_days} rows of ETH price data.")
print(df.head())
