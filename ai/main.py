from fastapi import FastAPI
# from data_loader import load_data
# from metrics import compute_metrics

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze-day")
def analyze_day(payload: dict):
#     clean_data = load_data(payload)
#     metrics = compute_metrics(clean_data)
    print(payload)
    return payload
