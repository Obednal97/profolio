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

/**
 * The largest amount the database can hold.
 *
 * Every money column is a Postgres `Int`, which is signed 32 bit, and they all
 * hold cents - so this is about £21.4m. The per-module schemas used to cap at
 * 9,999,999,999 in DOLLARS, which is a hundred times over the column's limit
 * in the wrong direction: a large value passed validation and then failed as
 * an integer overflow, which surfaces as a 500 rather than a 400.
 */
export const MAX_CENTS = 2_147_483_647;

/**
 * An amount of money in integer CENTS. The wire format for every resource.
 *
 * Rounds rather than rejecting a fraction of a cent. Forms compute cents by
 * multiplying, and `parseFloat("19.99") * 100` is 1998.9999999999998 in binary
 * floating point, so an `.int()` check would reject the value the user
 * obviously meant. Rounding here is the same decision the expense schema
 * already made, for the same reason.
 */
export const MoneyInCents = z
  .number()
  .min(0)
  .max(MAX_CENTS)
  .transform((value) => Math.round(value));

/**
 * An annual interest rate in integer BASIS POINTS, so 425 means 4.25%.
 *
 * Basis points on the wire as well as at rest, for the same reason money is
 * cents on the wire: the unit is not recoverable from the magnitude, and a
 * percentage is a decimal that has to be scaled somewhere. Doing it in the
 * browser at render keeps the whole server side in integers.
 */
export const RateInBasisPoints = z
  .number()
  .min(0)
  .max(10_000)
  .transform((value) => Math.round(value));
