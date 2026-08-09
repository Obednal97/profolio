import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { NotFound } from "@/server/http/errors";
import type {
  CreateExpenseInput,
  ExpenseQuery,
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
