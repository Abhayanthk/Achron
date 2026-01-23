from fastapi import FastAPI
from data_loader import focus_session_data, task_data, calendar_data, daily_report, xp_data, daily_log_data
from metrics import analyze_log_sentiment, calculate_reality_alignment, calculate_identity_alignment, calculate_burnout_efficiency

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
      
      # Advanced Analysis - Reality Alignment
      sentiment_map = analyze_log_sentiment(logData)
      
      reality_timeline = calculate_reality_alignment(daily_metrics, sentiment_map)
      identity_scatter = calculate_identity_alignment(daily_metrics, sentiment_map)
      burnout_curve = calculate_burnout_efficiency(daily_metrics)


      return {
          "daily_metrics": daily_metrics,
          "reality_timeline": reality_timeline,
          "identity_scatter": identity_scatter,
          "burnout_curve": burnout_curve,
          "log_sentiment_score": sentiment_map
      }
