import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { embedText, batchEmbed, cosineSimilarity } from "@/lib/embeddings";

export const runtime = "nodejs";

const SIMILARITY_THRESHOLD = 0.4;
const MAX_RESULTS = 20;

function extractBlockNoteText(json: unknown): string {
  if (!json || !Array.isArray(json)) return "";
  const texts: string[] = [];
  for (const block of json) {
    if (block.content && Array.isArray(block.content)) {
      for (const inline of block.content) {
        if (inline.text) texts.push(inline.text);
      }
    }
    if (block.children && Array.isArray(block.children)) {
      texts.push(extractBlockNoteText(block.children));
    }
  }
  return texts.join(" ");
}

interface SearchItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  text: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query = (body.query || "").trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [tasks, notes, projects, logs, habits, nonNegotiables, problems, brainstorms, events] =
    await Promise.all([
      prisma.task.findMany({
        where: { userId },
        select: { id: true, title: true, description: true, status: true },
        take: 30,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.note.findMany({
        where: { userId },
        select: { id: true, title: true, content: true, type: true },
        take: 30,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.project.findMany({
        where: { userId },
        select: { id: true, title: true, description: true, status: true },
        take: 20,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.dailyLog.findMany({
        where: { userId },
        select: { id: true, title: true, content: true, date: true },
        take: 30,
        orderBy: { date: "desc" },
      }),
      prisma.habit.findMany({
        where: { userId, archived: false },
        select: { id: true, name: true },
      }),
      prisma.nonNegotiable.findMany({
        where: { userId },
        select: { id: true, title: true },
      }),
      prisma.problemLog.findMany({
        where: { userId },
        select: {
          id: true,
          problem_name: true,
          platform: true,
          pattern_subtype: true,
          pattern_generalization_note: true,
          mistakes_text: true,
          edge_cases_found: true,
          invariant_or_key_property: true,
          learning_from_failure: true,
          core_tricks_used: true,
          failure_categories: true,
          tags: { select: { name: true } },
          patterns: { select: { name: true } },
        },
        take: 30,
        orderBy: { created_at: "desc" },
      }),
      prisma.brainstorm.findMany({
        where: { project: { userId } },
        select: { id: true, name: true, content: true, projectId: true },
        take: 20,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.calendarEvent.findMany({
        where: { userId },
        select: { id: true, title: true, start: true },
        take: 20,
        orderBy: { start: "desc" },
      }),
    ]);

  const items: SearchItem[] = [];

  for (const t of tasks) {
    items.push({
      id: t.id,
      type: "task",
      title: t.title,
      subtitle: t.status,
      url: "/tasks",
      text: [t.title, t.description || ""].join(" "),
    });
  }

  for (const n of notes) {
    const contentText = extractBlockNoteText(n.content);
    items.push({
      id: n.id,
      type: "note",
      title: n.title,
      subtitle: n.type,
      url: `/notes/${n.id}`,
      text: [n.title, contentText].join(" "),
    });
  }

  for (const p of projects) {
    items.push({
      id: p.id,
      type: "project",
      title: p.title,
      subtitle: p.status,
      url: `/projects/${p.id}`,
      text: [p.title, p.description || ""].join(" "),
    });
  }

  for (const l of logs) {
    items.push({
      id: l.id,
      type: "log",
      title: l.title,
      subtitle: new Date(l.date).toLocaleDateString(),
      url: "/logs",
      text: [l.title, l.content].join(" "),
    });
  }

  for (const h of habits) {
    items.push({
      id: h.id,
      type: "habit",
      title: h.name,
      subtitle: "Habit",
      url: "/habits",
      text: h.name,
    });
  }

  for (const nn of nonNegotiables) {
    items.push({
      id: nn.id,
      type: "non-negotiable",
      title: nn.title,
      subtitle: "Non-Negotiable",
      url: "/non-negotiables",
      text: nn.title,
    });
  }

  for (const p of problems) {
    items.push({
      id: p.id,
      type: "problem",
      title: p.problem_name,
      subtitle: p.platform,
      url: "/cp-tracker",
      text: [
        p.problem_name,
        p.platform,
        p.pattern_subtype || "",
        p.pattern_generalization_note,
        p.mistakes_text,
        p.edge_cases_found || "",
        p.invariant_or_key_property || "",
        p.learning_from_failure || "",
        p.core_tricks_used.join(" "),
        p.failure_categories.join(" "),
        p.tags.map((t) => t.name).join(" "),
        p.patterns.map((x) => x.name).join(" "),
      ].join(" "),
    });
  }

  for (const b of brainstorms) {
    const contentText = extractBlockNoteText(b.content);
    items.push({
      id: b.id,
      type: "brainstorm",
      title: b.name,
      subtitle: "Brainstorm",
      url: `/projects/${b.projectId}/brainstorm/${b.id}`,
      text: [b.name, contentText].join(" "),
    });
  }

  for (const e of events) {
    items.push({
      id: e.id,
      type: "event",
      title: e.title,
      subtitle: new Date(e.start).toLocaleDateString(),
      url: "/calendar",
      text: e.title,
    });
  }

  if (items.length === 0) {
    return NextResponse.json({ results: [] });
  }

  if (!process.env.GEMINI_API_KEY) {
    const lowerQuery = query.toLowerCase();
    const keywordResults = items
      .filter((item) => item.text.toLowerCase().includes(lowerQuery))
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        url: item.url,
        score: 1,
      }))
      .slice(0, MAX_RESULTS);
    return NextResponse.json({ results: keywordResults });
  }

  try {
    const [queryVec, itemVecs] = await Promise.all([
      embedText(query),
      batchEmbed(
        items.map((it) => ({
          key: `search:${it.type}:${it.id}`,
          text: it.text,
        })),
      ),
    ]);

    const scored = items
      .map((item) => {
        const vec = itemVecs.get(`search:${item.type}:${item.id}`);
        const score = vec ? cosineSimilarity(queryVec, vec) : 0;
        return {
          id: item.id,
          type: item.type,
          title: item.title,
          subtitle: item.subtitle,
          url: item.url,
          score,
        };
      })
      .filter((item) => item.score >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    return NextResponse.json({ results: scored });
  } catch {
    const lowerQuery = query.toLowerCase();
    const keywordResults = items
      .filter((item) => item.text.toLowerCase().includes(lowerQuery))
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        url: item.url,
        score: 1,
      }))
      .slice(0, MAX_RESULTS);
    return NextResponse.json({ results: keywordResults });
  }
}
