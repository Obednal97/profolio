import "server-only";
import type { Liability, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { MoneyUtils } from "@/server/money";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { NotFound } from "@/server/http/errors";
import type {
  CreateLiabilityInput,
  LiabilityQuery,
  UpdateLiabilityInput,
} from "./schemas";

/**
 * Liabilities, the other half of net worth. Balances are dollars on the wire
 * and integer cents at rest; interest rates are percentages on the wire and
 * basis points at rest. See schemas.ts for why that is written down.
 *
 * Ownership is enforced by scoping every query to the caller rather than
 * reading a row and comparing afterwards, so another user's liability is a 404
 * and the API never confirms to a caller that an id they cannot see exists.
 */

export type LiabilityResponse = Omit<Liability, "balance" | "interestRate"> & {
  balance: number;
  interestRate: number;
};

/**
 * A percentage to basis points and back.
 *
 * These exist because MoneyUtils.toBasisPoints and fromBasisPoints work in
 * FRACTIONS, not percentages: they scale by 10000, so it is 0.0425 that becomes
 * 425, and handing them 4.25 stores 42500. That is a hundred times the basis
 * points the column is documented to hold, so the percentage is scaled by 100
 * on each side. Both directions live here rather than inline at the call sites,
 * because the failure mode is getting one of the two wrong and only noticing
 * when a rate is read by something other than this service.
 *
 * Assets converts the same way MoneyUtils reads, so its stored rates are a
 * hundred times ours. Deliberately not matched: it round trips through its own
 * API so nothing has caught it, but the unit is wrong.
 */
function toBasisPoints(percentage: number): number {
  return MoneyUtils.toBasisPoints(MoneyUtils.safeDivide(percentage, 100));
}

function fromBasisPoints(basisPoints: number): number {
  return MoneyUtils.safeMultiply(MoneyUtils.fromBasisPoints(basisPoints), 100);
}

/** cents to dollars, basis points to percentage, on the way out. */
function toResponse(liability: Liability): LiabilityResponse {
  return {
    ...liability,
    balance: MoneyUtils.fromCents(liability.balance),
    interestRate: fromBasisPoints(liability.interestRate),
  };
}

/**
 * dollars to cents, percentage to basis points, and ISO strings to Date, on the
 * way in.
 *
 * Each field is tested against undefined, never for truthiness, so a PATCH can
 * set a balance of 0 or a rate of 0 without the value being read as an omission
 * and silently dropped. Fields the caller did not mention stay absent, so a
 * partial update cannot blank the rest of the row.
 */
function toRow(input: UpdateLiabilityInput): Prisma.LiabilityUpdateInput {
  const row: Prisma.LiabilityUpdateInput = {};

  if (input.name !== undefined) row.name = input.name;
  if (input.balance !== undefined) row.balance = MoneyUtils.toCents(input.balance);
  if (input.interestRate !== undefined) {
    row.interestRate = toBasisPoints(input.interestRate);
  }
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
      balance: MoneyUtils.toCents(input.balance),
      interestRate: toBasisPoints(input.interestRate),
      dueDate: input.dueDate === undefined ? undefined : new Date(input.dueDate),
    },
  });

  return toResponse(liability);
}

/**
 * The caller's liabilities.
 *
 * A demo session resolves to a user id that owns no rows, so this returns an
 * empty list rather than generated debts. There is deliberately no demo
 * generator here: invented figures in a net worth calculation are worse than an
 * obviously empty one.
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

  return liabilities.map(toResponse);
}

export async function getLiability(id: string): Promise<LiabilityResponse> {
  const user = await requireUser();

  const liability = await prisma.liability.findFirst({
    where: { id, userId: user.id },
  });
  if (!liability) throw new NotFound("Liability not found");

  return toResponse(liability);
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

  return toResponse(liability);
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
