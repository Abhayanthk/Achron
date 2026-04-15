// Recovery Protocol v1 — Action Matrix
// 13 Triggers × 7 Severity Levels = 91 curated actions
// All actions are Easy to Medium difficulty — no high-effort tasks.
// The goal is momentum restoration, not productivity.

export const TRIGGERS = [
  {
    key: "TIREDNESS",
    label: "Tiredness",
    description: "Body genuinely depleted",
  },
  {
    key: "RESISTANCE",
    label: "Resistance",
    description: "Temptation pulling you away",
  },
  {
    key: "EXAM_PRESSURE",
    label: "Exam Pressure",
    description: "Pressure causing freeze or escape",
  },
  {
    key: "AVOIDANCE",
    label: "Avoidance",
    description: "Procrastinating on something real",
  },
  {
    key: "BOREDOM",
    label: "Boredom / Too Hard",
    description: "Task feels impossible or boring",
  },
  {
    key: "FEELING_INFERIOR",
    label: "Feeling Inferior",
    description: "Insecurity or comparison to others",
  },
  {
    key: "ACCIDENTAL_TEMPTATION",
    label: "Accidental Temptation",
    description: "Came across something triggering",
  },
  {
    key: "EXTERNAL_FAILURE",
    label: "External Failure",
    description: "Bad contest, group session, or result",
  },
  {
    key: "SOCIAL_DISCOMFORT",
    label: "Social Discomfort",
    description: "Awkward interaction or exposed feeling",
  },
  {
    key: "OVERSTIMULATION",
    label: "Overstimulation",
    description: "Brain crashed, still craving more",
  },
  {
    key: "TRANSITION_MOMENT",
    label: "Transition Moment",
    description: "Between tasks, nothing lined up",
  },
  {
    key: "PHYSICAL_STATE",
    label: "Physical State",
    description: "Hungry, dehydrated, poor sleep",
  },
  {
    key: "LONELINESS",
    label: "Loneliness",
    description: "Wanting connection but not reaching out",
  },
] as const;

export type TriggerKey = (typeof TRIGGERS)[number]["key"];

export const SEVERITY_LEVELS = [
  { level: 1, label: "L1", name: "Slip", timeframe: "~60 min" },
  { level: 2, label: "L2", name: "Lapse", timeframe: "~3 hrs" },
  { level: 3, label: "L3", name: "Stumble", timeframe: "~1 day" },
  { level: 4, label: "L4", name: "Slide", timeframe: "~3 days" },
  { level: 5, label: "L5", name: "Fall", timeframe: "~1 week" },
  { level: 6, label: "L6", name: "Collapse", timeframe: "~2 weeks" },
  { level: 7, label: "L7", name: "Drift", timeframe: "~1 month" },
] as const;

// ─── Action Matrix ──────────────────────────────────────────────────────
// Key: `${TriggerKey}_${severity}` → action string
// Every action is intentionally low-friction. No guilt. Just momentum.

export const ACTION_MATRIX: Record<string, string> = {
  // ── TIREDNESS ──────────────────────────────────────────────────────────
  TIREDNESS_1:
    "Stand up, splash cold water on your face, and set a 5-minute timer to just sit at your desk. Don't work — just sit.",
  TIREDNESS_2:
    "Lie down for exactly 10 minutes with an alarm set. Then get up and write one sentence about what you were working on.",
  TIREDNESS_3:
    "Take a full rest. When you wake, open your task list and just read through it. Star the easiest one. That's your only job.",
  TIREDNESS_4:
    "Today is a recovery day. Drink a full glass of water, take a walk outside for 10 minutes, then write down 3 things you did this week.",
  TIREDNESS_5:
    "Audit your sleep this week — write down your rough sleep times. Then set one alarm for tomorrow. That's your re-entry anchor.",
  TIREDNESS_6:
    "Your body is talking. Listen. Write a short note: 'I burned out because ___.' Then set one tiny task for tomorrow — something you can finish in under 5 minutes.",
  TIREDNESS_7:
    "Reset your defaults. Go to bed at a fixed time tonight. Set one alarm. Tomorrow, your only task is to sit at your desk for 15 minutes. That's it.",

  // ── RESISTANCE ─────────────────────────────────────────────────────────
  RESISTANCE_1:
    "Close the temptation tab or app. Open your workspace. Set a 5-minute timer and just exist with the work open. No pressure to start.",
  RESISTANCE_2:
    "Write down what's pulling you away. Then write one reason you started the thing you're resisting. Read it once. Now set a 10-min work timer.",
  RESISTANCE_3:
    "Put your phone in another room. Open your task list. Pick the easiest task and do only that. Celebrate when done.",
  RESISTANCE_4:
    "Delete or log out of the app that's tempting you (just for today). Open your project and read your last note or commit. Write one follow-up line.",
  RESISTANCE_5:
    "Block the distracting apps for 24 hours. Then open your work and spend 15 minutes on the easiest piece. Write 'I came back' in your daily log.",
  RESISTANCE_6:
    "Journal this: 'I've been pulled away for days because ___.' Then choose the single smallest task on your list. Do just that. Nothing else matters today.",
  RESISTANCE_7:
    "This is a pattern reset. Uninstall or fully block the distraction for one week. Open your task list and pick one task you can do in 10 minutes. Do it now.",

  // ── EXAM PRESSURE ──────────────────────────────────────────────────────
  EXAM_PRESSURE_1:
    "Write down exactly what's due and when. Just the list. Then take 3 deep breaths. Pick the smallest item and spend 5 minutes on it.",
  EXAM_PRESSURE_2:
    "Stop looking at the whole syllabus. Open one topic — just the first page. Read it for 10 minutes. That's progress.",
  EXAM_PRESSURE_3:
    "Write a micro-plan: 3 things you'll cover today. Make them embarrassingly small. Then do the first one.",
  EXAM_PRESSURE_4:
    "The freeze is real, but momentum beats motivation. Open one past exam paper. Read just the first question. Write down what topic it covers. Done.",
  EXAM_PRESSURE_5:
    "Write down everything you're afraid of about this exam. Then circle the one that's actually likely. Now open that topic and do 15 minutes of review.",
  EXAM_PRESSURE_6:
    "You've been frozen for a while. Write a realistic plan for the remaining days — not ideal, realistic. Then start the very first item for just 20 minutes.",
  EXAM_PRESSURE_7:
    "Accept that you can't cover everything. Pick the 3 highest-yield topics. Open the first one. Read for 15 minutes. You're back in the game.",

  // ── AVOIDANCE ──────────────────────────────────────────────────────────
  AVOIDANCE_1:
    "Open the thing you're avoiding. Just open it. Read the first line. Now close it if you want — but you looked at it.",
  AVOIDANCE_2:
    "Set a timer for 10 minutes. Work on the avoided task. When the timer goes off, stop. You're allowed to stop.",
  AVOIDANCE_3:
    "Write down why you're avoiding this task. Be honest. Then do the smallest possible sub-task within it. One function. One paragraph. One sketch.",
  AVOIDANCE_4:
    "Open the task you're avoiding. Read the first line. Write one sentence of notes about it. That's it. You just broke the seal.",
  AVOIDANCE_5:
    "This task has been haunting you. Break it into 3 laughably small steps. Do step one now. Steps 2 & 3 can wait.",
  AVOIDANCE_6:
    "Write a letter to the task: 'I've been avoiding you because ___.' Then open it and spend 15 minutes. Not to finish — just to be in the space.",
  AVOIDANCE_7:
    "Redefine the task. The old version overwhelmed you. Strip it to its core — what's the absolute minimum deliverable? Write that down. Now do the first 20 minutes.",

  // ── BOREDOM / TOO HARD ─────────────────────────────────────────────────
  BOREDOM_1:
    "Switch to a different task for 10 minutes — something that uses a different part of your brain. Then come back.",
  BOREDOM_2:
    "Make it a game: set a 15-minute sprint. See how far you can get. No quality bar — just speed.",
  BOREDOM_3:
    "Shrink the problem. If the task feels too big, cross off everything except the easiest 20%. Do that part.",
  BOREDOM_4:
    "Change your environment. Move to a different spot. Put on different music. Then open the task and try a new angle for 15 minutes.",
  BOREDOM_5:
    "Watch a 5-minute tutorial or read one article about the topic you're stuck on. Sometimes a new voice makes it click. Then try for 15 minutes.",
  BOREDOM_6:
    "You've been disengaged for a while. Write down: 'The reason this matters is ___.' If you can't answer, ask: should you drop it and do something else?",
  BOREDOM_7:
    "If it's been boring for a month, it's not boredom — it's misalignment. Write down what you'd rather be doing. Then do the smallest version of the original task anyway. Show yourself you can.",

  // ── FEELING INFERIOR ───────────────────────────────────────────────────
  FEELING_INFERIOR_1:
    "Close social media. Open your own work. Read through your recent progress. Write one thing you're proud of, no matter how small.",
  FEELING_INFERIOR_2:
    "Write down who triggered this feeling and why. Then write one skill you have that you've improved in the last month. Now do one task.",
  FEELING_INFERIOR_3:
    "Open your XP history or habit streak. Look at the hard evidence of your effort. Now pick one task you know you can finish today.",
  FEELING_INFERIOR_4:
    "Comparison is data, not judgment. Write: 'They're ahead in ___, but I've been building ___.' Now spend 20 minutes on your own work.",
  FEELING_INFERIOR_5:
    "Unfollow or mute the accounts causing the comparison spiral for one week. Then open your project and spend 20 minutes making visible progress.",
  FEELING_INFERIOR_6:
    "Write a list of 5 things you've learned or built in the past 3 months. Not to feel better — to see clearly. Then pick one current task and do 15 minutes.",
  FEELING_INFERIOR_7:
    "This has been going on too long. Write down your actual goals — not someone else's. Strip away what you think you 'should' be. Now do one thing aligned with YOUR path.",

  // ── ACCIDENTAL TEMPTATION ──────────────────────────────────────────────
  ACCIDENTAL_TEMPTATION_1:
    "Close it immediately. Don't bargain with it. Set a 5-minute timer, sit with the discomfort, then open your task list.",
  ACCIDENTAL_TEMPTATION_2:
    "You stumbled on it — that's not a failure. Close it, take 3 breaths, and redirect to the easiest task on your list. Do 10 minutes.",
  ACCIDENTAL_TEMPTATION_3:
    "Write down what you came across and how it made you feel. Then block that source for 24 hours. Open your work and do 15 minutes.",
  ACCIDENTAL_TEMPTATION_4:
    "The trigger already happened. Don't spiral. Write: 'I encountered ___ but I'm choosing to ___.' Open your easiest task and do 15 minutes.",
  ACCIDENTAL_TEMPTATION_5:
    "Audit your triggers: where do you keep encountering this? Block two access points right now. Then spend 20 minutes on any productive task.",
  ACCIDENTAL_TEMPTATION_6:
    "Set up a harder barrier — app blocker, content filter, or physical separation. Then choose one task and work for 20 minutes. Rebuild the streak.",
  ACCIDENTAL_TEMPTATION_7:
    "This needs an environment redesign. Remove access points systematically. Then open your task list, pick the gentlest entry, and do 15 minutes. You're reclaiming control.",

  // ── EXTERNAL FAILURE ───────────────────────────────────────────────────
  EXTERNAL_FAILURE_1:
    "Write one sentence: what happened and what you'll take from it. Then move on to the next task. Don't dwell.",
  EXTERNAL_FAILURE_2:
    "It stings. Sit with it for 5 minutes — no distraction. Then open your practice log and do one easy problem or task. You're still in this.",
  EXTERNAL_FAILURE_3:
    "Write a brief post-mortem: what went wrong, what was outside your control, what you'd change. Then do one productive task — anything.",
  EXTERNAL_FAILURE_4:
    "Failure data is still data. Log what happened in your daily journal. Then find one thing you can practice or improve based on it. Do 20 minutes.",
  EXTERNAL_FAILURE_5:
    "Look at your history of attempts. You've recovered before. Write down the pattern. Now do one practice session — easy difficulty. No performance pressure.",
  EXTERNAL_FAILURE_6:
    "Write honestly: 'This failure made me feel ___ and I responded by ___.' Now choose to respond differently. Open your easiest task and do 20 minutes.",
  EXTERNAL_FAILURE_7:
    "A month of paralysis after a failure is avoidance wearing a mask. Name what you're really afraid of. Then do the smallest possible act of practice. 10 minutes. Start.",

  // ── SOCIAL DISCOMFORT ──────────────────────────────────────────────────
  SOCIAL_DISCOMFORT_1:
    "Take 3 deep breaths. Write down what happened in one sentence. Then redirect — open your task list and do the most absorbing task you have.",
  SOCIAL_DISCOMFORT_2:
    "The awkwardness fades. Write: 'This moment will be irrelevant in 48 hours.' Then channel the energy into 15 minutes of focused work.",
  SOCIAL_DISCOMFORT_3:
    "Journal about it briefly — what happened, how you felt, what you'd do next time. Then physically move to a solo workspace and do one task.",
  SOCIAL_DISCOMFORT_4:
    "Social pain is real but temporary. Write it out: 'I felt exposed because ___.' Then prove to yourself you're still capable — do 20 minutes of work.",
  SOCIAL_DISCOMFORT_5:
    "You've been replaying the interaction. Write it down once — fully. Then close the journal and do 20 minutes of work. Don't let a moment steal a week.",
  SOCIAL_DISCOMFORT_6:
    "Write a compassionate note to yourself about what happened. Then list 3 things you like about yourself that have nothing to do with that situation. Now do one task.",
  SOCIAL_DISCOMFORT_7:
    "This has been sitting in your chest for too long. Write the full story once. Then write: 'I'm moving forward.' Pick the gentlest task on your list and spend 15 minutes on it.",

  // ── OVERSTIMULATION ────────────────────────────────────────────────────
  OVERSTIMULATION_1:
    "Close all tabs and apps. Sit in silence for 2 minutes. Then open only your task list — one tab, nothing else.",
  OVERSTIMULATION_2:
    "Your brain is fried. Don't add more input. Sit in quiet for 5 minutes. Then open one task and engage for 10 minutes. Slow, deliberate.",
  OVERSTIMULATION_3:
    "Go analog: write your task on a piece of paper. Close your laptop for 10 minutes. When you reopen, do only that one task.",
  OVERSTIMULATION_4:
    "Digital detox for 30 minutes. No screens. Walk, stretch, or sit. When you return, your only job is one task for 15 minutes.",
  OVERSTIMULATION_5:
    "Your dopamine baseline needs a reset. Spend 1 hour today without screens. When you come back, start with the most boring productive task you have. Retrain the reward system.",
  OVERSTIMULATION_6:
    "Schedule 2 hours of no-screen time into your day. Use it for walking, cooking, or cleaning. Then return and do 20 minutes of focused work. Rebuild your attention span.",
  OVERSTIMULATION_7:
    "You need a full dopamine detox day. No social media, no games, no binge content for 24 hours. Tomorrow, your only task is one 30-minute focused session. Rebuild from there.",

  // ── TRANSITION MOMENT ──────────────────────────────────────────────────
  TRANSITION_MOMENT_1:
    "Don't default to scrolling. Open your task list right now. Pick the next thing and set a 10-minute timer. Bridge the gap with action.",
  TRANSITION_MOMENT_2:
    "Write a micro-plan for the next 2 hours. Just 2-3 items. Then start the first one immediately. Transitions are where momentum dies.",
  TRANSITION_MOMENT_3:
    "You're between things — this is the danger zone. Pick your easiest task and do it now. Don't sit in the void.",
  TRANSITION_MOMENT_4:
    "Create a 'default mode' rule: when between tasks, always do ___. (Read notes, review flashcards, organize tasks.) Do that default action now for 15 minutes.",
  TRANSITION_MOMENT_5:
    "You've been floating for a week. Write your top 3 priorities right now. Not everything — just 3. Then start the easiest one for 20 minutes.",
  TRANSITION_MOMENT_6:
    "The gap between projects is where drift starts. Write a one-page plan for the next 2 weeks. Then start day 1 of that plan immediately.",
  TRANSITION_MOMENT_7:
    "A month of transitions means you don't have a system. Today, build one: write 3 daily non-negotiables and pin them to your workspace. Then do the first one.",

  // ── PHYSICAL STATE ─────────────────────────────────────────────────────
  PHYSICAL_STATE_1:
    "Drink a full glass of water right now. Eat something — anything. Then reassess if you can work or need to rest.",
  PHYSICAL_STATE_2:
    "Eat a proper meal. No screen while eating. When done, set a gentle 10-minute timer to work. If you're still too tired, that's okay — log the rest day.",
  PHYSICAL_STATE_3:
    "Your body comes first. Hydrate, eat, and if you're sleep-deprived, take a 20-minute nap with an alarm. Then do one small task.",
  PHYSICAL_STATE_4:
    "Audit the basics: water intake, meals, sleep hours this week. Write them down. Fix the worst one today. Then do 15 minutes of light work.",
  PHYSICAL_STATE_5:
    "Set 3 daily alarms: hydrate, eat lunch, sleep by ___. Follow them for 3 days before trying to be productive. Physical foundation first.",
  PHYSICAL_STATE_6:
    "Your body has been running on fumes. Write a recovery plan: sleep schedule, meal times, hydration goals. Today, just do the plan. One small task is bonus.",
  PHYSICAL_STATE_7:
    "A month of poor physical state is a health issue, not a productivity one. Set one non-negotiable: sleep by a fixed time tonight. Everything else is secondary. One task if you can.",

  // ── LONELINESS ─────────────────────────────────────────────────────────
  LONELINESS_1:
    "Text someone — anyone — a simple 'hey, thinking of you.' Then open your task list and do 10 minutes of work. Connection + action.",
  LONELINESS_2:
    "Put on background audio — a podcast, coffeeshop ambiance, or a study-with-me video. Then do 15 minutes of work. You don't have to be alone in silence.",
  LONELINESS_3:
    "Write down 3 people you'd like to talk to. Send one of them a message. Then do one task. You're allowed to need people and still be productive.",
  LONELINESS_4:
    "Go to a café, library, or co-working space — be around humans. Bring one task and work on it for 20 minutes. Proximity helps.",
  LONELINESS_5:
    "Schedule one social interaction this week — coffee, call, or study session. Put it in your calendar now. Then do 15 minutes of work as your daily anchor.",
  LONELINESS_6:
    "Loneliness left unchecked becomes isolation. Reach out to two people today — one you're close to, one you've drifted from. Then do one task.",
  LONELINESS_7:
    "Send a single 'hey' message to someone you haven't spoken to in a while. No expectations. Then join a community or server related to your work. Post once. Do 15 minutes of work.",
};

/**
 * Get the recovery action for a given trigger and severity level.
 */
export function getRecoveryAction(
  triggerKey: string,
  severity: number,
): string {
  const key = `${triggerKey}_${severity}`;
  return (
    ACTION_MATRIX[key] ||
    "Take a deep breath. Open your task list. Pick the easiest thing. Do it for 10 minutes. You showed up — that's the win."
  );
}
