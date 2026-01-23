from textblob import TextBlob
from datetime import datetime, timedelta
from collections import defaultdict
import statistics
import math

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
    
    final_map = {}
    for date, total_score in sentiment_map.items():
        final_map[date] = total_score / count_map[date]
    return final_map

def normalize_series(values):
    """
    Min-Max normalization to 0-1 range.
    """
    if not values:
        return []
    min_val = min(values)
    max_val = max(values)
    if max_val == min_val:
        return [0.5 for _ in values] # Default middle if all same
    return [(v - min_val) / (max_val - min_val) for v in values]

def calculate_reality_alignment(daily_metrics, sentiment_map):
    """
    1. Reality Alignment Timeline
    x-axis: date
    y-axes (normalized 0-1):
        - execution_rate
        - xp_per_hour (xp_per_focus_hour)
        - sentiment_rolling_7d
    """
    # Sort by date
    sorted_metrics = sorted(daily_metrics, key=lambda x: x['date'])
    
    dates = []
    execution_rates = []
    xp_rates = []
    raw_sentiments = []
    
    # Extract raw series
    for m in sorted_metrics:
        date = m['date']
        dates.append(date)
        
        # Execution Rate (already 0-1 typically, but we treat it as values)
        execution_rates.append(m.get('execution_rate', 0))
        
        # XP Per Hour
        xp_rates.append(m.get('xp_per_hour', 0))
        
        # Sentiment (fill missing with 0)
        raw_sentiments.append(sentiment_map.get(date, 0))

    # Calculate 7-day rolling average for sentiment
    sentiment_rolling = []
    for i in range(len(raw_sentiments)):
        window = raw_sentiments[max(0, i-6):i+1]
        avg = statistics.mean(window) if window else 0
        sentiment_rolling.append(avg)

    # Normalize all to 0-1 for the "Alignment" check
    # Note: Execution rate is usually 0-1, but XP and Sentiment are different scales.
    # To visualize "Divergence", they should be on same relative scale.
    norm_execution = normalize_series(execution_rates)
    norm_xp = normalize_series(xp_rates)
    norm_sentiment = normalize_series(sentiment_rolling)
    
    timeline_data = []
    for i, date in enumerate(dates):
        timeline_data.append({
            "date": date,
            "normalized_execution": round(norm_execution[i], 2),
            "normalized_xp": round(norm_xp[i], 2),
            "normalized_sentiment": round(norm_sentiment[i], 2),
            "raw_execution": execution_rates[i],
            "raw_xp": xp_rates[i],
            "raw_sentiment": sentiment_rolling[i]
        })
        
    return timeline_data

def calculate_identity_alignment(daily_metrics, sentiment_map):
    """
    2. Identity Alignment Scatter
    x: sentiment_score (-1 to 1)
    y: execution_rate (0 to 1)
    """
    scatter_data = []
    
    for m in daily_metrics:
        date = m['date']
        sentiment = sentiment_map.get(date, 0)
        execution = m.get('execution_rate', 0)
        
        # Determine Quadrant Label (Implicit)
        # Stoic: Low Sentiment, High Execution
        # Aligned: High Sentiment, High Execution
        # Delusional: High Sentiment, Low Execution
        # Drifting: Low Sentiment, Low Execution
        status = "Unknown"
        if execution >= 0.5:
            status = "Aligned" if sentiment >= 0 else "Stoic"
        else:
            status = "Delusional" if sentiment >= 0 else "Drifting"
            
        scatter_data.append({
            "date": date,
            "x_sentiment": round(sentiment, 2),
            "y_execution": round(execution, 2),
            "status": status
        })
        
    return scatter_data

def calculate_burnout_efficiency(daily_metrics):
    """
    3. Burnout Efficiency Curve
    x: focus_hours
    y: xp_per_focus_hour
    """
    curve_data = []
    
    for m in daily_metrics:
        # Convert total_focus_duration (seconds) to hours
        focus_hours = m.get('total_focus_duration', 0) / 3600
        xp_per_hour = m.get('xp_per_hour', 0)
        
        if focus_hours > 0:
            curve_data.append({
                "date": m['date'],
                "x_focus_hours": round(focus_hours, 2),
                "y_efficiency": round(xp_per_hour, 2)
            })
            
    return curve_data
