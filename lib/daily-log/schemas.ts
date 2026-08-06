/**
 * Input validation for the Daily Evidence Log.
 *
 * Every write crosses this boundary before it reaches the repository. The
 * length caps here are input hygiene, not product rules — `Did` is still
 * "any number of lines" as far as a human is concerned; the ceilings exist so
 * an unbounded request body can't be posted at the database.
 */

import { z } from "zod";

import { isCalendarDate } from "./date";
import { normalizeDidBullets } from "./domain";

/** Generous ceilings: reached by an attacker, never by a person logging a day. */
const MAX_DID_BULLETS = 100;
const MAX_BULLET_LENGTH = 500;
const MAX_AVOIDED_LENGTH = 280;
const MAX_CORE_ITEMS = 20;
const MAX_LABEL_LENGTH = 80;

/**
 * A `"YYYY-MM-DD"` calendar day.
 *
 * `z.iso.date()` covers the shape; the refine defers to the date module so
 * "is this a real day" has exactly one implementation. Without it, inputs like
 * `2026-02-30` can reach `toUtcDate` and roll forward into the wrong day.
 */
export const calendarDateSchema = z
      .iso.date()
      .refine(isCalendarDate, { message: "Not a real calendar day" });

/**
 * Saving a card. `date` is validated here but *authorised* in the repository —
 * the backfill window is a domain rule, not a shape.
 */
export const saveCardSchema = z.object({
      date: calendarDateSchema,
      did: z
            .union([
                  z.string().max(MAX_DID_BULLETS * MAX_BULLET_LENGTH),
                  z.array(z.string().max(MAX_BULLET_LENGTH)).max(MAX_DID_BULLETS),
            ])
            .transform(normalizeDidBullets),
      avoided: z
            .string()
            .max(MAX_AVOIDED_LENGTH)
            .nullish()
            // An empty box means "nothing recorded", which is null, not "".
            .transform((value) => {
                  const trimmed = value?.trim() ?? "";
                  return trimmed.length > 0 ? trimmed : null;
            }),
      core: z
            .array(
                  z.object({
                        coreItemId: z.string().min(1),
                        done: z.boolean(),
                  }),
            )
            .max(MAX_CORE_ITEMS)
            .default([]),
});

export type SaveCardInput = z.infer<typeof saveCardSchema>;

export const createCoreItemSchema = z.object({
      label: z.string().trim().min(1).max(MAX_LABEL_LENGTH),
});

export type CreateCoreItemInput = z.infer<typeof createCoreItemSchema>;

/**
 * Editing a core item. Renaming or deactivating only ever affects future
 * cards — historical `labelSnapshot` values are never rewritten.
 */
export const updateCoreItemSchema = z
      .object({
            label: z.string().trim().min(1).max(MAX_LABEL_LENGTH).optional(),
            active: z.boolean().optional(),
            sortOrder: z.number().int().min(0).max(999).optional(),
      })
      .refine((patch) => Object.keys(patch).length > 0, {
            message: "Nothing to update",
      });

export type UpdateCoreItemInput = z.infer<typeof updateCoreItemSchema>;
