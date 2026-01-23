from fastapi import FastAPI
from data_loader import focus_session_data, task_data, calendar_data, daily_report, xp_data, daily_log_data
from metrics import detect_burnout, analyze_identity_drift, analyze_log_sentiment

app = FastAPI()
# source .venv/bin/activate activate the virtual environment
# uvicorn main:app --reload

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze-day")
def analyze_day(payload: dict):
      focus_session_per_day = focus_session_data(payload["focusSession"])
      tasksData = task_data(payload["tasks"])
      calendarData = calendar_data(payload["calendarEvents"])
      xpData = xp_data(payload["xpLogs"])
      logData = daily_log_data(payload["dailyLog"])

      daily_metrics = daily_report(focus_session_per_day, tasksData, calendarData, xpData)
      
      # Advanced Analysis
      sentiment_map = analyze_log_sentiment(logData)
      burnout_analysis = detect_burnout(daily_metrics, sentiment_data=sentiment_map)
      
      identity_analysis = analyze_identity_drift(xpData)


      return {
          "daily_metrics": daily_metrics,
          "burnout_analysis": burnout_analysis,
          "identity_analysis": identity_analysis,
          "log_sentiment_score": sentiment_map
      }
