# AI Strategy Module

## Setup (one time)
```bash
cd ai-strategy
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip3 install -r requirements.txt
python3 generate_data.py
python3 train.py
```

## Run the API
```bash
source venv/bin/activate
python3 api.py
```
API runs at: http://localhost:8000
Docs at:     http://localhost:8000/docs

## Test manually
```bash
curl "http://localhost:8000/predict?price=3000&volatility=0.04"
curl "http://localhost:8000/health"
```

## Endpoints
- GET /health — service status
- GET /predict?price=X&volatility=Y — AI strike recommendation
- GET /strategies?price=X — all three strategy variants
