import "server-only";
import { z } from "zod";
import { blankable, isoDate } from "@/server/http/zod";

/**
 * Request schemas for liabilities.
 *
 * THE WIRE FORMAT: `balance` arrives and leaves in DOLLARS, stored as integer
 * cents, the same contract properties use. `interestRate` arrives and leaves as
 * an annual PERCENTAGE, so 4.25 means 4.25%, and is stored as basis points, so
 * 425. Neither unit is recoverable from a value's magnitude, which is why both
 * are written down here and converted in exactly one place, the service.
 *
 * Zero is a real balance and a real rate. An interest-free loan and a fully
 * repaid debt are both facts a user can record, so the service tests every
 * field against undefined rather than for truthiness. Properties shipped the
 * truthy version of that conversion and it turned a legitimate zero into "field
 * not provided", leaving the old value in place after an edit meant to clear it.
 */

/**
 * A balance in dollars.
 *
 * The ceiling looks arbitrary and is not: the column is a Postgres `Int`, so
 * the stored cents must fit in a signed 32 bit integer. Anything above this
 * would be rejected by the database as an overflow, which surfaces as a 500
 * rather than a validation error.
 */
const Money = z.number().min(0).max(21_474_836);

/**
 * An annual percentage, e.g. 4.25.
 *
 * Rounded to the nearest basis point on arrival because the column is an
 * integer count of them and `4.257` is a rate a caller can plausibly send.
 */
const InterestRate = z.number().min(0).max(100);

export const CreateLiabilitySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    balance: Money,
    /**
     * Required rather than defaulted. The column is not nullable and has no
     * database default, so the API has to supply something, and quietly
     * choosing 0 would invent a rate: it understates what a debt costs instead
     * of admitting the rate is unknown.
     */
    interestRate: InterestRate,
    dueDate: blankable(isoDate),
  })
  .strict();
export type CreateLiabilityInput = z.infer<typeof CreateLiabilitySchema>;

/**
 * Every field optional, so a PATCH that changes one field is not rejected for
 * omitting the rest.
 */
export const UpdateLiabilitySchema = CreateLiabilitySchema.partial().strict();
export type UpdateLiabilityInput = z.infer<typeof UpdateLiabilitySchema>;

export const LiabilityQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(500).default(50),
  })
  .strict();
export type LiabilityQuery = z.infer<typeof LiabilityQuerySchema>;

export const LiabilityIdSchema = z.object({ id: z.uuid() }).strict();
