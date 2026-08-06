# Achron — Project Notes

Next.js 16 (App Router, Turbopack) + React 19. Personal productivity app: tasks, habits, notes, calendar, focus timer, CP (competitive programming) tracker, journaling/analytics.

## Stack

- **DB/ORM:** Prisma 7 + `@prisma/adapter-pg` over `pg.Pool`. Postgres = **Neon** (serverless, auto-suspends when idle → cold-start P1001 errors are normal, not bugs; just retry).
  - Client singleton: `lib/prisma.ts` (memoized on `globalForPrisma` for hot-reload). Log level set to `['warn','error']` (was `['query']` — too noisy, changed this session).
  - Config: `prisma.config.ts` (loads `DATABASE_URL` via dotenv). Schema: `prisma/schema.prisma`.
  - **Migration history is inconsistent** — some columns (e.g. `Note.embedding` pgvector, `Note.sourceFiles`) were added via `db push`, not `migrate dev`, so `prisma migrate dev` will detect drift and demand a full reset. **Never run `migrate dev` blind on this repo** — check `prisma db pull --print` first, add missing fields to schema.prisma, then use `prisma db push` (additive, no `--accept-data-loss`) instead.
- **Auth:** Clerk (`@clerk/nextjs`). Every route/page does `const {userId} = await auth()` itself — **no `middleware.ts`**, route protection is per-handler. Public routes (no auth) are listed in `proxy.ts` (this repo's oddly-named Clerk middleware file), currently `/api/task-proposal(.*)` and `/api/inngest(.*)`.
  - `User.id` **is** the Clerk user id. Rows are provisioned async via Inngest (`syncUser` in `inngest/functions.ts`) on `clerk/user.created` — a brand-new user may not have a `User` row yet.
- **Background jobs:** **Inngest** (not Trigger.dev — a `trigger` MCP server may be connected in-session but is unused by this repo). Client: `inngest/client.ts` (`id:"achron"`). Functions: `inngest/functions.ts`, registered in `serve({functions:[...]})` at `app/api/inngest/route.ts`.
  - Local dev **requires** the Inngest dev server running separately, or queued events never execute (jobs sit at whatever status they were created with):
    ```
    npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
    ```
    Dashboard: `http://localhost:8288` (watch steps/traces live). Look for `"apps synced, disabling auto-discovery"` in its log — that confirms it found your functions.
  - **Inngest SDK v4 defaults to cloud mode** — it does NOT infer dev mode from `NODE_ENV` (that was v3). Since `.env` contains real `INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY`, without `INNGEST_DEV=1` every `inngest.send()` silently goes to Inngest Cloud and the local dev server never sees the event (jobs stuck PENDING, no runs at :8288). `INNGEST_DEV=1` is set in `.env` for local dev — never set it in production env.
- **AI:** Google **Gemini** via `@google/generative-ai` (no Vercel AI SDK, no OpenAI/Anthropic SDK in this repo).
  - Env: `GEMINI_API_KEY`, `GEMINI_MODEL` (general default `gemini-3-flash-preview`), `GEMINI_TRAINER_MODEL` (CP-trainer specific, see below), `GEMINI_EMBED_MODEL`/`GEMINI_EMBED_DIM` (default `gemini-embedding-001` / 768, in `lib/embeddings.ts`).
  - Embeddings are **in-memory cached only** (`lib/embeddings.ts`, `embedCache` Map) — nothing persisted, no pgvector index actually used despite the `Note.embedding` column existing.
  - Structured JSON output pattern: `getGenerativeModel({model, systemInstruction, generationConfig:{responseMimeType:"application/json", responseSchema}})` — see `app/api/task-proposal/route.ts` (simple) and `lib/cp-trainer/agent.ts` (with function-calling).
  - **Gemini free tier is 5 requests/minute per model** — hits 429 fast on any multi-step agent loop. Always wrap calls in retry-with-backoff reading the server's `retryDelay` hint (see `withRetry` in `lib/cp-trainer/agent.ts`).
- **Data fetching:** TanStack Query + `axios`/`fetch`. No server actions anywhere (`"use server"` grep is empty) — everything is `app/api/**/route.ts` handlers.
- **UI:** Tailwind + shadcn/ui (`components/ui/*` — Card, Badge, Select, Skeleton, Form, etc. all present, check before adding new primitives). Dark theme: zinc-900/black backgrounds, indigo-600 accents. Icons: `lucide-react`.

## CP Tracker (`cp-tracker`)

Existing feature for logging competitive-programming solves and reviewing performance.

- **Core model:** `ProblemLog` (`prisma/schema.prisma`) — one row per solve attempt. Captures platform (`enum-ish string`: `"CF"|"AtCoder"|"LC"|"CodeChef"|"Other"`), `contest_id` (free text, not a relation), rating, `solve_status_type` (`"Solved Clean"|"Solved with Hint"|"Solved after Editorial"|"Partial"|"Failed"`), `idea_source` (`"Self"|"Small Hint"|"Major Hint"|"Editorial"`), time breakdown (`time_to_first_idea_minutes`, `implementation_time_minutes`, `debug_time_minutes`, `total_time_minutes`), `attempt_count`, difficulty/psychology (`perceived_difficulty_before/after` 1-5, `mental_load_score`/`stress_level_during` **1-10**), `failure_categories String[]`, `final_verdict` (`"AC"|"WA"|"TLE"|"MLE"|"RE"`), spaced-repetition fields (`must_revisit`, `rev_level` 0-6, `last_revised_date`), plus M2M `tags`/`patterns`/`keyLearnings`.
- **UI:** `app/cp-tracker/page.tsx` (dashboard: weakness heatmap, tag chart, status donut, accuracy gauge, revision queue, CF rating chart), `app/cp-tracker/library/page.tsx` + `library/ProblemLibraryClient.tsx` (searchable/filterable table, semantic search toggle), `app/cp-tracker/log/` (LoggerForm — the save form), `components/cp-tracker/*` (14 components).
- **API:** `app/api/cp-tracker/{route,[id],semantic-search,metadata,tags,patterns,learnings}/route.ts`.
- **Semantic search:** `app/api/cp-tracker/semantic-search/route.ts` — embeds a query + all the user's problems, cosine-ranks. Problem→text builder now lives in `lib/cp-trainer/problem-text.ts` (`buildProblemText`, extracted this session so both semantic-search and the trainer share one implementation).
- **Revision cadence:** `lib/revision.ts` — `REVISION_SCHEDULE=[0,2,7,21,60,120]` days per level, `isRevisionDue`, `getNextRevisionDate`.

## CP Trainer (`lib/cp-trainer/`) — NEW, built this session

An agentic coach: analyzes saved **Codeforces-only** problems, diagnoses time wasted + weaknesses, produces a structured coaching report. Built in 5 gated phases, all verified against real DB data + a live Gemini call.

**Why CF-only / this scope:** user explicitly narrowed scope to Codeforces (`platform === "CF"`) for v1, and asked for a *true agent* (tool-calling loop), not a single-shot LLM summary — see plan file for the full rationale, still at `/Users/abhayanthk/.claude/plans/i-want-to-build-snoopy-hammock.md` if deeper context is ever needed (approved plan, not meant to be re-read routinely).

### Architecture (rebuilt on @inngest/agent-kit, July 2026)
```
UI (Analyze button) → POST /api/cp-tracker/trainer → creates TrainerReport(PENDING)
                                                     → inngest.send("cp-trainer/analyze.requested")
UI polls GET /api/cp-tracker/trainer/[id] (React Query refetchInterval) until DONE/FAILED

Inngest job `runTrainerAnalysis` (inngest/functions.ts):
  retries: 4, throttle {limit:2, period:"1m"} (Gemini free tier is 5rpm)
  mark RUNNING → runTrainerAgent CALLED IN FUNCTION BODY (NOT step.run — AgentKit
  creates its own durable steps; nesting would break) → persist DONE
  throw anywhere → persist FAILED + error message

runTrainerAgent (lib/cp-trainer/agent.ts) — AgentKit:
  1. Deterministic scopeMetrics() computed first (ground truth, no LLM)
  2. createAgent("cp-trainer-coach") + createNetwork, single agent, deterministic
     function router (re-invoke while lastResult.toolCalls.length > 0), maxIter=6.
     Every inference auto-becomes step.ai.infer (durable/memoized/retried) because
     AgentKit detects the Inngest step context via AsyncLocalStorage.
     Tools (createTool + zod): getProblems, getProblemDetail,
     findSimilarSolvedProblems (handler wrapped in opts.step.run — embeddings
     memoized across replays). Revision schedule inlined in system prompt
     (Gemini rejects zero-param functions; not worth a rate-limited call).
  3. Finalize pass: direct @google/generative-ai generateContent + responseSchema
     → strict CoachingReport JSON, wrapped in getStepTools()?.run("finalize-report")
  4. Graceful fallbacks unchanged: no key / empty scope / loop error / finalize
     error → metrics-only report, error noted in rootCauses; partial tool trace
     preserved via own createState() handle
```

**Two AgentKit/Gemini landmines fixed here (don't regress):**
- **thoughtSignature:** Gemini 3.x HARD-REQUIRES `thoughtSignature` echoed on
  function-calling turns; AgentKit's Gemini adapter (≤0.13.x, still unfixed as of
  0.13.3-alpha Feb 2026) drops it → deterministic HTTP 400 "Function call is
  missing a thought_signature" on the 2nd inference. Hence the loop runs on
  `gemini-2.5-flash` (`GEMINI_LOOP_MODEL`), which tolerates the omission; the
  no-tools finalize stays on `gemini-3.5-flash` (`GEMINI_TRAINER_MODEL`). When
  upgrading agent-kit, check the adapter for thoughtSignature round-tripping
  before moving the loop to a 3.x model.
- **Parallel tool calls:** adapter serializes them as [fc, fc, fr, fr]; Gemini 400s
  unless each functionCall is immediately followed by its functionResponse —
  `interleaveToolPairs()` in the agent's `lifecycle.onStart` re-pairs history
  before every inference.

### Files
- `lib/cp-trainer/queries.ts` — `getCfProblems(userId)`, `byContest()`, `listCfContests()`. `CF_PLATFORM="CF"` constant.
- `lib/cp-trainer/metrics.ts` — pure functions, no LLM: `ratingBaseline(rating)` (expected solve-minutes by CF rating band), `computeTimeWaste()` (overtime vs baseline / debug-thrash / resubmit penalty), `aggregateWeakness()` (failure categories, weak tags/patterns via assisted-solve rate, rating ceiling, stress clusters), `scopeMetrics()` (assembles the full snapshot for a scope).
- `lib/cp-trainer/rag.ts` — `findSimilarSolvedProblems()`: embeds target + candidates via `lib/embeddings.ts`, cosine-ranks, returns top-k solved problems as study anchors.
- `lib/cp-trainer/agent.ts` — AgentKit agent/network/tools, `interleaveToolPairs`, `CoachingReport` type + Gemini `responseSchema`, fallback report builders. No in-process retry code — 429s are Inngest step retries now.
- `inngest/functions.ts` — `runTrainerAnalysis` job (added alongside pre-existing `syncUser`).
- `app/api/cp-tracker/trainer/route.ts` (POST create+trigger / GET list), `[id]/route.ts` (GET one, for polling), `contests/route.ts` (GET distinct CF contest_ids for the scope picker).
- `app/cp-tracker/trainer/page.tsx` (server, lists past reports) + `components/cp-tracker/trainer/{TrainerClient.tsx,CoachReport.tsx}` (client: scope picker, Analyze button, poll-until-done, report rendering). Entry point: "Trainer" button added to `app/cp-tracker/page.tsx` header.

### Data model
`TrainerReport` in `prisma/schema.prisma`: `scope` (`"contest"|"overall"`), `contest_id`, `status` (`PENDING|RUNNING|DONE|FAILED`), `report`/`metrics`/`trace` (Json), `model`, `error`. Indexed on `[userId, created_at]`. Applied via `prisma db push` (not `migrate dev` — see drift note above), so **there is no migration file for it**, just a synced DB + schema.

### Known data caveat
As of last check, real `ProblemLog` rows in the dev DB have **all time fields = 0** — so time-wasted analysis will report "no waste detected" until the Log Problem form is actually filled in with `time_to_first_idea_minutes`/`implementation_time_minutes`/`debug_time_minutes`. This is a data-entry gap, not a bug in `computeTimeWaste`.

### Running it locally
1. `npm run dev` (Next.js) in one terminal.
2. `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest` in another — **required**, otherwise Analyze sticks at PENDING forever.
3. `/cp-tracker` → **Trainer** button → pick scope → Analyze. Watch `localhost:8288` for the live tool-call trace.
4. If a run pauses ~30-45s mid-loop, that's the 429 backoff handling the 5rpm free-tier limit, not a hang.

### Verified this session
- Schema push (additive, zero data loss).
- Metrics math sanity-checked against 13 real CF `ProblemLog` rows (correctly flagged weak tags, rating ceiling, high-stress problems).
- Full agent loop run against real Gemini API: 11 tool calls, valid structured report referencing actual logged problems by name.
- Job lifecycle (PENDING→RUNNING→DONE) + Prisma Json round-trip.
- `npx tsc --noEmit` and `npx next build` both clean with all trainer code in place.
- Git note: as of this writing, Phase 0-1 files (schema.prisma, metrics.ts, queries.ts, problem-text.ts, semantic-search rewire) are committed (commit `9848f58`, not authored by the assistant in this session); Phase 2-4 files (agent.ts, rag.ts, Inngest job, API routes, UI) are **uncommitted** working-tree changes — check `git status` before assuming everything is saved.
