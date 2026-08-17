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

/**
 * Like `blankable`, but for a PATCH, where "clear this field" and "leave this
 * field alone" are different requests and both have to be expressible.
 *
 * `blankable` folds "" and null into undefined, which a partial update reads as
 * "not provided". That is right on a create, where there is nothing to clear,
 * and wrong on an update: it made an optional field write-once, since no
 * request could ever set it back to empty. Here "" and null both mean null,
 * which the service writes, and only omitting the key means leave it.
 */
export function clearable<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (value === "" ? null : value),
    schema.nullable().optional(),
  );
}

/** An ISO date, with or without a time component. */
export const isoDate = z.iso.datetime({ offset: true }).or(z.iso.date());
