import "server-only";
import { z } from "zod";

/**
 * Request schemas for expenses.
 *
 * THE WIRE FORMAT: expense amounts are in CENTS in both directions, unlike
 * assets and properties which use dollars. That is the existing contract - the
 * expense form multiplies by 100 before sending and the list divides by 100
 * when rendering - and changing it would silently misprice every stored row.
 * It is written down here because nothing else in the codebase says so.
 */

/**
 * `parseFloat("19.99") * 100` is 1998.9999999999998, and the column is an
 * integer, so the client's own conversion produces a value Postgres rejects.
 * Round on arrival rather than trusting the caller to have done it.
 */
const AmountInCents = z
  .number()
  .min(0)
  .max(1_000_000_000_00)
  .transform((value) => Math.round(value));

const IsoDate = z.iso.datetime({ offset: true }).or(z.iso.date());

export const CreateExpenseSchema = z
  .object({
    amount: AmountInCents,
    category: z.string().trim().min(1).max(100),
    date: IsoDate,
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

/**
 * Every field optional. The old UpdateExpenseDto was a copy of the create DTO
 * rather than a PartialType of it, so a PATCH that changed one field was
 * rejected for missing the other three.
 */
export const UpdateExpenseSchema = CreateExpenseSchema.partial().strict();
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

export const ExpenseQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(500).default(50),
    /** Only expenses dated within this many days. */
    days: z.coerce.number().int().min(1).max(3650).optional(),
  })
  .strict();
export type ExpenseQuery = z.infer<typeof ExpenseQuerySchema>;

export const ExpenseIdSchema = z.object({ id: z.uuid() }).strict();
