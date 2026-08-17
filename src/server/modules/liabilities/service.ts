import "server-only";
import type { Liability, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { NotFound } from "@/server/http/errors";
import type {
  CreateLiabilityInput,
  LiabilityQuery,
  UpdateLiabilityInput,
} from "./schemas";

/**
 * Liabilities, the other half of net worth.
 *
 * Nothing here converts a unit. Balances are integer cents and rates are
 * integer basis points, on the wire and at rest, so a row goes out exactly as
 * stored. The browser divides for display. Every conversion this module used to
 * do was a chance to do it in one direction and not the other, and assets got
 * exactly that wrong for its rates.
 *
 * Ownership is enforced by scoping every query to the caller rather than
 * reading a row and comparing afterwards, so another user's liability is a 404
 * and the API never confirms to a caller that an id they cannot see exists.
 */

/** The row as stored. There is nothing to convert, so this is the row. */
export type LiabilityResponse = Liability;

/**
 * ISO date strings to Date. Amounts and rates pass straight through.
 *
 * Each field is tested against undefined, never for truthiness, so a PATCH can
 * set a balance of 0 or a rate of 0 without the value being read as an omission
 * and silently dropped. Fields the caller did not mention stay absent, so a
 * partial update cannot blank the rest of the row.
 */
function toRow(input: UpdateLiabilityInput): Prisma.LiabilityUpdateInput {
  const row: Prisma.LiabilityUpdateInput = {};

  if (input.name !== undefined) row.name = input.name;
  if (input.balance !== undefined) row.balance = input.balance;
  if (input.interestRate !== undefined) row.interestRate = input.interestRate;
  // null is an explicit clear, which is why this tests against undefined and
  // not for truthiness. Omitting the key leaves the stored date alone.
  if (input.dueDate !== undefined) {
    row.dueDate = input.dueDate === null ? null : new Date(input.dueDate);
  }

  return row;
}

export async function createLiability(
  input: CreateLiabilityInput,
): Promise<LiabilityResponse> {
  const user = await requireUser();
  assertNotDemo(user);

  const liability = await prisma.liability.create({
    data: {
      userId: user.id,
      name: input.name,
      balance: input.balance,
      interestRate: input.interestRate,
      dueDate: input.dueDate === undefined ? undefined : new Date(input.dueDate),
    },
  });

  return liability;
}

/**
 * The caller's liabilities.
 *
 * A demo session never reaches here: the route returns generated debts before
 * calling this, the same way it does for assets, expenses and properties. A
 * demo user id owns no rows, so without that this returned an empty list and
 * the demo dashboard showed a net worth with no debt side.
 */
export async function listLiabilities(
  query: LiabilityQuery,
): Promise<LiabilityResponse[]> {
  const user = await requireUser();

  const liabilities = await prisma.liability.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: query.limit,
  });

  return liabilities;
}

export async function getLiability(id: string): Promise<LiabilityResponse> {
  const user = await requireUser();

  const liability = await prisma.liability.findFirst({
    where: { id, userId: user.id },
  });
  if (!liability) throw new NotFound("Liability not found");

  return liability;
}

export async function updateLiability(
  id: string,
  input: UpdateLiabilityInput,
): Promise<LiabilityResponse> {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.liability.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Liability not found");

  const liability = await prisma.liability.update({
    where: { id },
    data: toRow(input),
  });

  return liability;
}

export async function deleteLiability(id: string): Promise<{ success: true }> {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.liability.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Liability not found");

  await prisma.liability.delete({ where: { id } });

  return { success: true };
}
