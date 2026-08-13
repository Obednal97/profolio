import "server-only";
import { z } from "zod";
import { blankable } from "@/server/http/zod";

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

/**
 * An ISO date that also has to be a real instant in a plausible range. The date
 * on a parsed statement line is whatever a regex pulled off the page, and the
 * parser hands back the original string when it cannot recognise the format, so
 * the format check alone is not enough to keep an unreadable line out of the
 * ledger.
 */
const StatementDate = IsoDate.refine(
  (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    const year = parsed.getUTCFullYear();
    return year >= 1970 && year <= 2100;
  },
  { message: "Transaction date is not a usable date" },
);

/**
 * One reviewed line from a bank statement.
 *
 * The statement is parsed in the browser by `src/lib/pdfParser.ts`, so what
 * arrives here is ordinary untrusted input that happens to have been produced by
 * our own code. Every field is revalidated rather than accepted on the strength
 * of where it came from, and the fields the parser carries for its own purposes
 * - the client-side id, the raw statement text, the confidence score - are not
 * accepted at all, because the server has no use for them and strict validation
 * would otherwise force us to define rules for values we intend to ignore.
 *
 * `amount` is integer cents, the same unit as the rest of this file and as
 * `ParsedTransaction.amount`. There is deliberately no scaling anywhere in the
 * import path: the parser multiplies by 100 when it reads the statement, so a
 * second conversion here would store every figure a hundred times over.
 */
const ImportedTransactionSchema = z
  .object({
    /**
     * Reuses the rounding that `AmountInCents` already does, and for the same
     * reason as the expense form: the CSV reader in PdfUploader multiplies the
     * statement figure by 100 without rounding, so a line of 9.45 arrives as
     * 944.9999999999999 and an integer column rejects it. Rounding here turns a
     * whole statement failing validation into the cent it obviously meant.
     * Zero is refused because a statement line with no value is not a
     * transaction we can record.
     */
    amount: AmountInCents.refine((cents) => cents > 0, {
      message: "Transaction amounts must be greater than zero",
    }),
    date: StatementDate,
    description: z.string().trim().min(1).max(500),
    /**
     * Which way the money moved. Kept because the expense table has no sign of
     * its own and reads income off the category, so the service needs to know a
     * refund from a purchase to categorise it honestly.
     */
    type: z.enum(["debit", "credit"]),
    /**
     * The classifier's guess, which the reviewer may have overridden. Validated
     * for shape only. It cannot be checked against the category taxonomy in
     * `transactionClassifier.ts` because the merchant database maps Amazon,
     * Amex fees and foreign transaction fees to `online`, `credit-cards` and
     * `fees`, none of which that taxonomy defines, so a whitelist would reject
     * the parser's own output.
     */
    category: blankable(
      z
        .string()
        .trim()
        .min(1)
        .max(100)
        .regex(
          /^[a-z0-9_-]+$/,
          "Category must be a lower-case category identifier",
        ),
    ),
  })
  .strict();
export type ImportedTransactionInput = z.infer<typeof ImportedTransactionSchema>;

/**
 * One statement at a time. The cap exists because the whole batch is written in
 * a single database transaction, and an unbounded array would hold that
 * transaction open for as long as a caller cared to keep posting rows. A year of
 * a busy current account is a few hundred lines, so this is well clear of any
 * real statement.
 */
export const MAX_IMPORT_TRANSACTIONS = 2000;

export const ImportExpensesSchema = z
  .object({
    transactions: z
      .array(ImportedTransactionSchema)
      .min(1, "Provide at least one transaction to import")
      .max(
        MAX_IMPORT_TRANSACTIONS,
        `Cannot import more than ${MAX_IMPORT_TRANSACTIONS} transactions at once. Split the statement and import it in parts.`,
      ),
  })
  .strict();
export type ImportExpensesInput = z.infer<typeof ImportExpensesSchema>;
