# AI Backend (Learning Module)

## Purpose
This module analyzes structured productivity data and produces
basic metrics and insights.  
It is built for learning system design, not for production use.

Current scope (v1):
- Clean and normalize productivity data
- Compute basic metrics (no AI yet)
- Prepare structured input for future local LLM analysis

Non-goals (for now):
- No automatic scheduling
- No habit tracking logic
- No direct database access
- No agents or orchestration frameworks

## Data Inputs
- Task records (created, completed)
- Focus session hours (per day)

All inputs are provided as structured JSON.

## Outputs
- Task completion rate
- Average focus hours per day
- Simple textual summary (printed to console)

## v1 matrice
- plan_adherence_rate
→ Did I do what I said I would today?
- tasks_completed / tasks_planned
→ Execution clarity
- focus_hours
→ Reality check (energy + discipline)
- carryover_tasks
→ Friction detector
- one_win / one_miss (manual log -> can use category for this(win/lose))
→ Human reflection (tiny text)

## Tools
- Python
- pandas (for data processing)

## Learning Goals
- Understand data pipelines
- Practice separation of concerns
- Build AI-ready system foundations
