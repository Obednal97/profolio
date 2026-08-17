import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { NotFound } from "@/server/http/errors";
import { INCOME_CATEGORY_IDS } from "@/lib/transactionClassifier";
import type {
  CreateExpenseInput,
  ExpenseQuery,
  ImportExpensesInput,
  ImportedTransactionInput,
  UpdateExpenseInput,
} from "./schemas";

/**
 * Expenses. Amounts are integer cents throughout, on the wire as well as at
 * rest - see schemas.ts.
 *
 * Ownership is enforced by scoping every query to the caller rather than
 * reading a record and comparing afterwards, so a row belonging to someone
 * else is a 404 and the API never confirms that an id exists to a caller who
 * cannot see it.
 */

export async function createExpense(input: CreateExpenseInput) {
  const user = await requireUser();
  assertNotDemo(user);

  return prisma.expense.create({
    data: {
      userId: user.id,
      amount: input.amount,
      category: input.category,
      date: new Date(input.date),
      notes: input.notes,
    },
  });
}

export async function listExpenses(query: ExpenseQuery) {
  const user = await requireUser();

  const where: Prisma.ExpenseWhereInput = { userId: user.id };
  if (query.days !== undefined) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - query.days);
    where.date = { gte: since };
  }

  return prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: query.limit,
  });
}

export async function getExpense(id: string) {
  const user = await requireUser();

  const expense = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });
  if (!expense) throw new NotFound("Expense not found");

  return expense;
}

export async function updateExpense(id: string, input: UpdateExpenseInput) {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Expense not found");

  return prisma.expense.update({
    where: { id },
    data: {
      amount: input.amount,
      category: input.category,
      notes: input.notes,
      date: input.date ? new Date(input.date) : undefined,
    },
  });
}

/**
 * Which categories mean money coming in.
 *
 * Imported from the category tree rather than written out here. This set
 * existed three times - in this file, in the dashboard and implicitly in the
 * classifier - and nothing kept the copies in step.
 */
const INCOME_CATEGORIES = INCOME_CATEGORY_IDS;

/** Where a row with no usable category ends up. */
const UNCATEGORISED = "other";

/**
 * The identity of a transaction for deduplication: the calendar day it fell on,
 * the amount in cents, and the description with case and runs of whitespace
 * flattened.
 *
 * Statements carry no stable reference we could key on, so this is the closest
 * thing to an identity available. The day rather than the timestamp is
 * deliberate: a statement gives a date and nothing finer, so two imports of the
 * same line must agree even if one of them arrived with a time attached.
 */
function duplicateKey(
  date: Date,
  amountInCents: number,
  description: string | null,
): string {
  const day = date.toISOString().slice(0, 10);
  const normalised = (description ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `${day}|${amountInCents}|${normalised}`;
}

/**
 * The category to store, which is not necessarily the one the caller sent.
 *
 * A credit is money arriving, and filing it under the category the classifier
 * guessed from the merchant name would add spending that never happened - a
 * refund from a supermarket would be recorded as groceries. Since income is
 * signalled by the category alone, a credit that is not already in an income
 * category is stored as income.
 *
 * The reverse matters just as much and was missing. A debit carrying an income
 * category is money going out recorded as money coming in, which moves the
 * dashboard's headline figure in both directions at once. The classifier used
 * to produce exactly that - it had 'payment' as a keyword for 'freelance' - and
 * while that is fixed, the category arrives from the browser and a reviewer can
 * set it by hand, so the rule is enforced here rather than assumed upstream.
 */
function categoryFor(row: ImportedTransactionInput): string {
  const claimed = (row.category ?? UNCATEGORISED).trim().toLowerCase();
  if (row.type === "credit" && !INCOME_CATEGORIES.has(claimed)) {
    return "income";
  }
  if (row.type === "debit" && INCOME_CATEGORIES.has(claimed)) {
    return UNCATEGORISED;
  }
  return claimed;
}

/**
 * Imports reviewed statement lines, skipping those already recorded.
 *
 * Amounts pass through untouched. `ParsedTransaction.amount` is integer cents -
 * `parseAmount` in pdfParser.ts multiplies by 100 as it reads the statement, the
 * CSV reader in PdfUploader does the same, and TransactionReview divides by 100
 * to display - and the expense column is integer cents too, so any conversion
 * here would be a hundredfold error rather than a correction.
 *
 * Duplicates are matched as a multiset rather than a set of distinct keys: the
 * existing rows are counted, and each incoming row consumes one of them. Two
 * identical coffees on the same day are a real thing that happens, so treating
 * the key as unique would have quietly dropped the second one, while counting
 * matches still guarantees that re-importing a statement adds nothing.
 *
 * The read and the write share one transaction, so a batch cannot land
 * half-imported.
 */
export async function importExpenses(
  input: ImportExpensesInput,
): Promise<{ imported: number; skipped: number }> {
  const user = await requireUser();
  assertNotDemo(user);

  const rows = input.transactions.map((transaction) => ({
    amount: transaction.amount,
    category: categoryFor(transaction),
    date: new Date(transaction.date),
    notes: transaction.description,
  }));

  // Only existing rows that could share a calendar day and an amount with
  // something in this batch can be duplicates, which keeps the comparison read
  // proportional to the batch rather than to the user's whole history.
  const timestamps = rows.map((row) => row.date.getTime());
  const from = new Date(Math.min(...timestamps));
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(Math.max(...timestamps));
  to.setUTCHours(23, 59, 59, 999);
  const amounts = Array.from(new Set(rows.map((row) => row.amount)));

  return prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findMany({
      where: {
        userId: user.id,
        date: { gte: from, lte: to },
        amount: { in: amounts },
      },
      select: { amount: true, date: true, notes: true },
    });

    const unmatched = new Map<string, number>();
    for (const expense of existing) {
      const key = duplicateKey(expense.date, expense.amount, expense.notes);
      unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
    }

    const toCreate: Prisma.ExpenseCreateManyInput[] = [];
    let skipped = 0;

    for (const row of rows) {
      const key = duplicateKey(row.date, row.amount, row.notes);
      const available = unmatched.get(key) ?? 0;
      if (available > 0) {
        unmatched.set(key, available - 1);
        skipped += 1;
        continue;
      }
      toCreate.push({ userId: user.id, ...row });
    }

    if (toCreate.length > 0) {
      await tx.expense.createMany({ data: toCreate });
    }

    return { imported: toCreate.length, skipped };
  });
}

export async function deleteExpense(id: string) {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Expense not found");

  await prisma.expense.delete({ where: { id } });

  return { success: true as const };
}
