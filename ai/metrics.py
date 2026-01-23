from datetime import datetime, timedelta
from collections import defaultdict
import statistics
from textblob import TextBlob

def analyze_log_sentiment(daily_logs):
    """
    Analyzes sentiment of daily logs. 
    Returns average polarity (-1 to 1) grouped by date.
    """
    sentiment_map = defaultdict(float)
    count_map = defaultdict(int)

    for log in daily_logs:
        blob = TextBlob(log['content'])
        sentiment_map[log['date']] += blob.sentiment.polarity
        count_map[log['date']] += 1
    
    # Average it out
    

    final_map = {}
    for date, total_score in sentiment_map.items():
        final_map[date] = total_score / count_map[date]
    print(final_map)
    return final_map

import numpy as np
from sklearn.linear_model import LinearRegression

def calculate_slope(values):
    """
    Calculates the slope of a list of values using sklearn LinearRegression.
    Returns 0 if len(values) < 2.
    """
    if len(values) < 2:
        return 0
    
    n = len(values)
    # Reshape x for sklearn: [[0], [1], [2], ...]
    x = np.array(range(n)).reshape(-1, 1)
    y = np.array(values)
    
    model = LinearRegression()
    model.fit(x, y)
    
    return model.coef_[0]

def detect_burnout(daily_report_data, sentiment_data={}):
    """
    Detects burnout risk based on 14-day trends AND sentiment analysis.
    Burnout Signal: Declining Focus + Declining XP + Increasing/Steady Planning + Negative Sentiment.
    """
    # Sort data by date just in case
    sorted_data = sorted(daily_report_data, key=lambda x: x['date'])
    
    # Get last 14 days
    last_14_days = sorted_data[-14:]
    if len(last_14_days) < 3:
        return {
            "is_burnout_risk": False, 
            "risk_score": 0, 
            "slopes": {"focus": 0, "xp": 0, "planning": 0},
            "reasons": ["Insufficient data for trend analysis"]
        }

    focus_values = [d['total_focus_duration'] for d in last_14_days]
    xp_values = [d['xp_earned'] for d in last_14_days]
    planned_values = [d['tasks_planned'] for d in last_14_days]

    focus_slope = calculate_slope(focus_values)
    xp_slope = calculate_slope(xp_values)
    planning_slope = calculate_slope(planned_values)
    
    # Calculate average sentiment for this period
    sentiment_scores = []
    for d in last_14_days:
        score = sentiment_data.get(d['date'], 0)
        sentiment_scores.append(score)
    
    avg_sentiment = statistics.mean(sentiment_scores) if sentiment_scores else 0

    # Risk Logic (Weighted Model)
    risk_score = 0
    reasons = []

    if focus_slope < -5: # Declining focus 
        risk_score += 1
        reasons.append("Declining Focus")
    
    if xp_slope < -10: # Declining output
        risk_score += 1
        reasons.append("Declining Output")
        
    if planning_slope >= 0: # Planning is not slowing down
        risk_score += 1
        reasons.append("Sustained Planning Load")
        
    if avg_sentiment < -0.1: # Negative Sentiment
        risk_score += 1
        reasons.append("Negative Log Sentiment")

    # Burnout threshold: 2 signals + high planning OR 3 signals
    is_burnout_risk = (risk_score >= 3) or (risk_score >= 2 and planning_slope >= 0)

    return {
        "is_burnout_risk": bool(is_burnout_risk),
        "risk_score": risk_score,
        "slopes": {
            "focus": round(focus_slope, 2),
            "xp": round(xp_slope, 2),
            "planning": round(planning_slope, 2)
        },
        "avg_sentiment": round(avg_sentiment, 2),
        "reasons": reasons
    }

def analyze_identity_drift(xp_logs):
    """
    Analyzes identity drift by comparing recent (7d) vs baseline (30d) category focus using XP Logs.
    Returns drift status, distributions, and metric range explanations.
    """
    now = datetime.now()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    recent_dist = defaultdict(int)
    baseline_dist = defaultdict(int)

    for log in xp_logs:
        # log['date'] is "YYYY-MM-DD"
        # We need to parse it to compare
        try:
            log_date = datetime.strptime(log['date'], "%Y-%m-%d")
        except:
            continue
            
        category = log.get('source') or "Uncategorized" # Assuming 'source' holds category name or we need to pass categories mapping
        amount = log['amount']

        if log_date >= seven_days_ago:
            recent_dist[category] += amount
        
        if log_date >= thirty_days_ago:
            baseline_dist[category] += amount

    # Find top categories
    def get_top(dist):
        if not dist: return None, 0
        return max(dist.items(), key=lambda x: x[1])

    top_recent, val_recent = get_top(recent_dist)
    top_baseline, val_baseline = get_top(baseline_dist)
    
    drift_detected = (top_recent != top_baseline) and (top_recent is not None) and (top_baseline is not None)

    return {
        "drift_detected": drift_detected,
        "current_identity": [top_recent, val_recent] if top_recent else None,
        "baseline_identity": [top_baseline, val_baseline] if top_baseline else None,
        "recent_distribution": dict(recent_dist),
        "baseline_distribution": dict(baseline_dist),
        "ranges": {
            "drift_score": "Boolean (True/False). True means your #1 focus category has changed in the last 7 days compared to the last 30.",
            "xp_values": "Raw XP points. >1000/week is high focus in a category.",
            "distribution": "Higher value = More focus. A balanced distribution means generalist, spiked means specialist."
        }
    }

def analyze_identity_drift_from_tasks(tasks_data):
    """
    Uses completed tasks to analyze identity drift.
    """
    # Filter completed tasks
    completed = [t for t in tasks_data if t['isCompleted']]
    
    # Time windows
    # We don't have exact completion date in the simple task dict from data_loader 
    # (it has 'plannedDate' or 'createdDate'). 
    # We should assume plannedDate ~ completionDate for this analysis or use createdDate approx.
    # Let's use the date provided in the task dict.
    
    now_str = datetime.now().strftime("%Y-%m-%d")
    seven_days_ago_str = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    thirty_days_ago_str = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    recent_dist = defaultdict(int)
    baseline_dist = defaultdict(int)

    for task in completed:
        date = task.get('plannedDate') or task.get('createdDate')
        category = task.get('category') or "Uncategorized"
        xp = task.get('xp', 10)

        if date >= seven_days_ago_str:
            recent_dist[category] += xp
        
        if date >= thirty_days_ago_str:
            baseline_dist[category] += xp

    # Find top categories
    def get_top(dist):
        if not dist: return None, 0
        return max(dist.items(), key=lambda x: x[1])

    top_recent, val_recent = get_top(recent_dist)
    top_baseline, val_baseline = get_top(baseline_dist)
    
    drift_detected = (top_recent != top_baseline) and (top_recent is not None) and (top_baseline is not None)

    return {
        "drift_detected": drift_detected,
        "current_identity": top_recent,
        "baseline_identity": top_baseline,
        "recent_distribution": dict(recent_dist),
        "baseline_distribution": dict(baseline_dist)
    }
