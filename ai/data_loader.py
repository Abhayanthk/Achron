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
                  "section": task["section"]["name"] if task["section"] else None,
                  "xp": task["xp"],
                  "status": task["status"]

            })
      return tasksData
