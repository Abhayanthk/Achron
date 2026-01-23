from pydantic import conset
from collections import defaultdict
def focus_session_data(sessionList: list):
      focusSessionPerDay = []
      for session in sessionList:
            focusSessionPerDay.append({
                  "id": session["id"],
                  "name": session["timer"]["name"] if session["timer"] else None,
                  "type": session["timer"]["type"] if session["timer"] else None,
                  "startTime": session["startTime"],
                  "endTime": session["endTime"],
                  "duration": session['duration'],
                  "date": session["startTime"].split("T")[0]
            })

      return focusSessionPerDay

def task_data(taskList: list):
      tasksData = []
      for task in taskList:
            tasksData.append({
                  "id": task["id"],
                  "title": task["title"],
                  "createdAt": task["createdAt"],
                  "updatedAt": task["updatedAt"],
                  "isCompleted": task['isCompleted'],
                  "plannedDate": task["dueDate"].split("T")[0] if task["dueDate"] else None,
                  "createdDate": task["createdAt"].split("T")[0],
                  "category": task["category"]["name"] if task["category"] else None,
                  "section": task["section"]["title"] if task["section"] else None,
                  "xp": task["xp"],
                  "status": task["status"]

            })
      return tasksData

def calendar_data(calendarList: list):
      calendarData = []
      for event in calendarList:
            calendarData.append({
                  "id": event["id"],
                  "title": event["title"],
                  "startTime": event["start"],
                  "endTime": event["end"],
                  "allDay": event["allDay"],
                  "color": event["color"],
                  "recurrence": event["recurrence"],
                  "isCompleted": event["isCompleted"],
                  "category": event["category"]["name"] if event["category"] else None,
                  "date": event["start"].split("T")[0]
            })
      return calendarData

def xp_data(xpList: list):
    xpLogs = []
    for log in xpList:
        xpLogs.append({
            "id": log["id"],
            "amount": log["amount"],
            "source": log["source"],
            "date": log["createdAt"].split("T")[0]
        })
    return xpLogs

def daily_log_data(logs: list):
    cleaned_logs = []
    for log in logs:
        cleaned_logs.append({
            "id": log["id"],
            "date": log["date"].split("T")[0], 
            "content": log["content"]
        })
    return cleaned_logs

from collections import defaultdict

def daily_report(focusData: list, taskData: list, calendarData: list, xpData: list):
    report = defaultdict(lambda: {
        "total_focus_duration": 0,
        "focus_sessions_count": 0,
        "tasks_planned": 0,
        "tasks_completed": 0,
        "xp_earned": 0,
        "calendar_events_count": 0
    })

    # Focus sessions
    for session in focusData:
        date = session["date"]
        report[date]["total_focus_duration"] += session["duration"]
        report[date]["focus_sessions_count"] += 1

    # Tasks
    for task in taskData:
        date = task["plannedDate"] or task["createdDate"]
        report[date]["tasks_planned"] += 1
        if task["isCompleted"]:
            report[date]["tasks_completed"] += 1
            # XP is now calculated from xpLogs, not tasks

    # XP Logs
    for log in xpData:
        date = log["date"]
        report[date]["xp_earned"] += log["amount"]


    # Calendar events
    for event in calendarData:
        date = event["date"]
        report[date]["calendar_events_count"] += 1
        
    # Process Metrics
    final_report = []
    consecutive_focus_days = 0
    sorted_dates = sorted(report.keys())

    for i, date in enumerate(sorted_dates):
        metrics = report[date]
        
        # 1. Execution Rate
        execution_rate = 0
        if metrics["tasks_planned"] > 0:
            execution_rate = metrics["tasks_completed"] / metrics["tasks_planned"]
            
        # 2. Focus-to-Output Ratio (minutes per task)
        focus_to_output_ratio = 0
        if metrics["tasks_completed"] > 0:
            focus_to_output_ratio = (metrics["total_focus_duration"] / 60) / metrics["tasks_completed"]
            
        # 3. XP Efficiency (XP per hour)
        xp_per_hour = 0
        if metrics["total_focus_duration"] > 0:
             xp_per_hour = metrics["xp_earned"] / (metrics["total_focus_duration"] / 3600)

        # 4. Consistency (Streak)
        if metrics["total_focus_duration"] > 0:
            consecutive_focus_days += 1
        else:
            consecutive_focus_days = 0 
            
        # 5. Avoidance Day Detection
        is_avoidance_day = (
            metrics["calendar_events_count"] > 0 and 
            metrics["total_focus_duration"] == 0 and 
            metrics["tasks_completed"] == 0
        )

        final_report.append({
            "date": date,
            **metrics,
            "execution_rate": round(execution_rate, 2),
            "focus_to_output_ratio": round(focus_to_output_ratio, 2),
            "xp_per_hour": round(xp_per_hour, 2),
            "consistency_streak": consecutive_focus_days,
            "is_avoidance_day": is_avoidance_day
        })
    print(final_report[0]["xp_per_hour"])

    return final_report
