/**
 * Data access for the Daily Evidence Log.
 *
 * The only module in this feature that imports Prisma. Everything above it —
 * routes, services, components — speaks the plain types in `./types`, so the
 * ORM stays swappable and the domain rules stay testable without a database.
 *
 * Two rules are enforced here rather than left to callers:
 *   - the backfill window, because a write is the last place to catch it, and
 *   - label immutability, because history losing its labels is unrecoverable.
 */

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fromUtcDate, toUtcDate, type CalendarDate } from "./date";
import { canEditCard } from "./domain";
import type { CardCoreProgress, CoreItemRecord, DailyCardRecord } from "./types";
import type { SaveCardInput } from "./schemas";

/**
 * A write was attempted outside the backfill window. Routes map this to 403 —
 * it is a refused request, not a malformed one.
 */
export class BackfillWindowError extends Error {
      constructor(
            readonly date: CalendarDate,
            readonly today: CalendarDate,
      ) {
            super(`Card for ${date} is outside the editable window (today is ${today})`);
            this.name = "BackfillWindowError";
      }
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

/** Core states read in the spine's display order, not insertion order. */
const cardInclude = {
      coreStates: { orderBy: { coreItem: { sortOrder: "asc" } } },
} satisfies Prisma.DailyCardInclude;

type CardRow = Prisma.DailyCardGetPayload<{ include: typeof cardInclude }>;

function mapCard(row: CardRow): DailyCardRecord {
      return {
            id: row.id,
            // A @db.Date arrives as UTC midnight; fromUtcDate is the only safe read.
            date: fromUtcDate(row.date),
            did: row.did,
            avoided: row.avoided,
            coreStates: row.coreStates.map((state) => ({
                  coreItemId: state.coreItemId,
                  labelSnapshot: state.labelSnapshot,
                  done: state.done,
            })),
      };
}

function mapCoreItem(row: {
      id: string;
      label: string;
      active: boolean;
      sortOrder: number;
}): CoreItemRecord {
      return {
            id: row.id,
            label: row.label,
            active: row.active,
            sortOrder: row.sortOrder,
      };
}

// ---------------------------------------------------------------------------
// Core items
// ---------------------------------------------------------------------------

/** The spine. Inactive items are excluded unless asked for — they still own history. */
export async function listCoreItems(
      userId: string,
      { includeInactive = false }: { includeInactive?: boolean } = {},
): Promise<CoreItemRecord[]> {
      const rows = await prisma.coreItem.findMany({
            where: { userId, ...(includeInactive ? {} : { active: true }) },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      return rows.map(mapCoreItem);
}

export async function createCoreItem(
      userId: string,
      label: string,
): Promise<CoreItemRecord> {
      const last = await prisma.coreItem.findFirst({
            where: { userId },
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
      });

      const created = await prisma.coreItem.create({
            data: { userId, label, sortOrder: (last?.sortOrder ?? -1) + 1 },
      });
      return mapCoreItem(created);
}

/**
 * Rename, reorder or soft-disable an item. Deliberately does not touch
 * `DailyCardCoreState.labelSnapshot`: past cards keep the label that was
 * actually committed to on the day.
 */
export async function updateCoreItem(
      userId: string,
      id: string,
      patch: { label?: string; active?: boolean; sortOrder?: number },
): Promise<CoreItemRecord | null> {
      // Scoped by userId so one user can never patch another's item.
      const result = await prisma.coreItem.updateMany({
            where: { id, userId },
            data: patch,
      });
      if (result.count === 0) return null;

      const updated = await prisma.coreItem.findUnique({ where: { id } });
      return updated ? mapCoreItem(updated) : null;
}

// ---------------------------------------------------------------------------
// Card reads
// ---------------------------------------------------------------------------

export async function getCardByDate(
      userId: string,
      date: CalendarDate,
): Promise<DailyCardRecord | null> {
      const row = await prisma.dailyCard.findUnique({
            where: { userId_date: { userId, date: toUtcDate(date) } },
            include: cardInclude,
      });
      return row ? mapCard(row) : null;
}

/** Newest first — the condensed list on the page. */
export async function getRecentCards(
      userId: string,
      limit: number,
): Promise<DailyCardRecord[]> {
      const rows = await prisma.dailyCard.findMany({
            where: { userId },
            orderBy: { date: "desc" },
            take: limit,
            include: cardInclude,
      });
      return rows.map(mapCard);
}

/**
 * Every card reduced to date + core counts. Powers both heatmap windows and
 * the rolling metric from a single read, without shipping bullet text for
 * days the user isn't looking at.
 */
export async function getCardSummaries(userId: string): Promise<CardCoreProgress[]> {
      const rows = await prisma.dailyCard.findMany({
            where: { userId },
            orderBy: { date: "asc" },
            select: { date: true, coreStates: { select: { done: true } } },
      });

      return rows.map((row) => ({
            date: fromUtcDate(row.date),
            coreDone: row.coreStates.filter((state) => state.done).length,
            coreTotal: row.coreStates.length,
      }));
}

/** Most recent card's date, or null when there is no history. Drives re-entry. */
export async function getMostRecentCardDate(
      userId: string,
): Promise<CalendarDate | null> {
      const row = await prisma.dailyCard.findFirst({
            where: { userId },
            orderBy: { date: "desc" },
            select: { date: true },
      });
      return row ? fromUtcDate(row.date) : null;
}

// ---------------------------------------------------------------------------
// Card writes
// ---------------------------------------------------------------------------

/**
 * Create or update the card for one day.
 *
 * On create, the spine is snapshotted from the user's currently active core
 * items — label and all. On update, `did`/`avoided`/`done` change and nothing
 * else: no item is added to an existing card and no label is rewritten, so a
 * rename tomorrow cannot alter what today's card says.
 *
 * @throws {BackfillWindowError} when `input.date` is outside the window.
 */
export async function saveCard(
      userId: string,
      input: SaveCardInput,
      today: CalendarDate,
): Promise<DailyCardRecord> {
      if (!canEditCard(input.date, today)) {
            throw new BackfillWindowError(input.date, today);
      }

      try {
            return await writeCard(userId, input);
      } catch (error) {
            // Two tabs saving the same new day race on the unique constraint.
            // The loser retries and lands in the update path.
            if (
                  error instanceof Prisma.PrismaClientKnownRequestError &&
                  error.code === "P2002"
            ) {
                  return await writeCard(userId, input);
            }
            throw error;
      }
}

function writeCard(userId: string, input: SaveCardInput): Promise<DailyCardRecord> {
      const date = toUtcDate(input.date);

      return prisma.$transaction(async (tx) => {
            const existing = await tx.dailyCard.findUnique({
                  where: { userId_date: { userId, date } },
                  select: { id: true, coreStates: { select: { coreItemId: true } } },
            });

            if (!existing) {
                  const activeItems = await tx.coreItem.findMany({
                        where: { userId, active: true },
                        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                  });
                  const doneById = new Map(
                        input.core.map((state) => [state.coreItemId, state.done]),
                  );

                  const created = await tx.dailyCard.create({
                        data: {
                              userId,
                              date,
                              did: input.did,
                              avoided: input.avoided,
                              coreStates: {
                                    create: activeItems.map((item) => ({
                                          coreItemId: item.id,
                                          labelSnapshot: item.label,
                                          done: doneById.get(item.id) ?? false,
                                    })),
                              },
                        },
                        include: cardInclude,
                  });
                  return mapCard(created);
            }

            await tx.dailyCard.update({
                  where: { id: existing.id },
                  data: { did: input.did, avoided: input.avoided },
            });

            // Only states already on the card may change. An item added to the
            // spine after this card was written does not retroactively appear on it.
            const onCard = new Set(existing.coreStates.map((state) => state.coreItemId));
            const toggle = async (done: boolean) => {
                  const ids = input.core
                        .filter((state) => state.done === done && onCard.has(state.coreItemId))
                        .map((state) => state.coreItemId);
                  if (ids.length === 0) return;

                  await tx.dailyCardCoreState.updateMany({
                        where: { dailyCardId: existing.id, coreItemId: { in: ids } },
                        data: { done },
                  });
            };
            await toggle(true);
            await toggle(false);

            const updated = await tx.dailyCard.findUniqueOrThrow({
                  where: { id: existing.id },
                  include: cardInclude,
            });
            return mapCard(updated);
      });
}
