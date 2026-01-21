from fastapi import FastAPI
from data_loader import focus_session_data, task_data
# from metrics import compute_metrics

app = FastAPI()
# uvicorn main:app --reload

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze-day")
def analyze_day(payload: dict):
      focus_session_per_day = focus_session_data(payload["focusSession"])
      tasksData = task_data(payload["tasks"])

      return {"focus_session_per_day": focus_session_per_day, "tasksData": tasksData}
