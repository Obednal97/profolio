import "server-only";
import { z } from "zod";

/**
 * Small helpers shared by the request schemas.
 */

/**
 * Treats an empty string and null as "not provided".
 *
 * Every form in this application initialises its optional text and date fields
 * to "" and submits them as-is, so a strict schema would reject a form the
 * user simply did not fill in. This normalises before validation rather than
 * making each field's rules tolerant of blanks.
 */
export function blankable<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    schema.optional(),
  );
}

/** An ISO date, with or without a time component. */
export const isoDate = z.iso.datetime({ offset: true }).or(z.iso.date());
