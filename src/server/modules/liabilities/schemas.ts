import "server-only";
import { z } from "zod";
import {
  MoneyInCents,
  RateInBasisPoints,
  blankable,
  clearable,
  isoDate,
} from "@/server/http/zod";

/**
 * Request schemas for liabilities.
 *
 * THE WIRE FORMAT: integers, in the units the database holds. `balance` is
 * CENTS and `interestRate` is BASIS POINTS, in both directions, so nothing on
 * the server converts anything. Neither unit is recoverable from a value's
 * magnitude, which is why it is written down here.
 *
 * This used to take dollars and a percentage and convert in the service. The
 * conversion is now the browser's, at the point of display, which is the only
 * place a decimal is wanted.
 *
 * Zero is a real balance and a real rate. An interest-free loan and a fully
 * repaid debt are both facts a user can record, so the service tests every
 * field against undefined rather than for truthiness. Properties shipped the
 * truthy version of that conversion and it turned a legitimate zero into "field
 * not provided", leaving the old value in place after an edit meant to clear it.
 */


export const CreateLiabilitySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    balance: MoneyInCents,
    /**
     * Required rather than defaulted. The column is not nullable and has no
     * database default, so the API has to supply something, and quietly
     * choosing 0 would invent a rate: it understates what a debt costs instead
     * of admitting the rate is unknown.
     */
    interestRate: RateInBasisPoints,
    dueDate: blankable(isoDate),
  })
  .strict();
export type CreateLiabilityInput = z.infer<typeof CreateLiabilitySchema>;

/**
 * Every field optional, so a PATCH that changes one field is not rejected for
 * omitting the rest.
 *
 * `dueDate` is overridden rather than inherited. On a create, `blankable` reads
 * an unfilled form field as "no due date", which is correct. On an update it
 * read it as "not provided", so a date once set could never be removed - the
 * only way to clear one was to delete the liability and enter it again.
 */
export const UpdateLiabilitySchema = CreateLiabilitySchema.partial()
  .extend({ dueDate: clearable(isoDate) })
  .strict();
export type UpdateLiabilityInput = z.infer<typeof UpdateLiabilitySchema>;

export const LiabilityQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(500).default(50),
  })
  .strict();
export type LiabilityQuery = z.infer<typeof LiabilityQuerySchema>;

export const LiabilityIdSchema = z.object({ id: z.uuid() }).strict();
