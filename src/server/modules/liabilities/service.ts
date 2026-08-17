import "server-only";
import type { Liability, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { MoneyUtils } from "@/server/money";
import {
  asBasisPoints,
  asCents,
  asDollars,
  asFraction,
  asPercent,
  type BasisPoints,
  type Percent,
} from "@/lib/moneyUnits";
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
 * Assets used to get this wrong in the other direction, handing MoneyUtils a
 * percentage and storing every rate a hundred times too large. It agrees with
 * this module now, and migration 20260817120000 rescaled the rows it wrote.
 */
function toBasisPoints(percentage: Percent): BasisPoints {
  // Decimal arithmetic via MoneyUtils rather than a plain /100, deliberately:
  // the branding is a compile-time change and is not worth altering how a
  // stored rate is computed to get it.
  return MoneyUtils.toBasisPoints(
    asFraction(MoneyUtils.safeDivide(percentage, 100)),
  );
}

function fromBasisPoints(basisPoints: BasisPoints): Percent {
  return asPercent(
    MoneyUtils.safeMultiply(MoneyUtils.fromBasisPoints(basisPoints), 100),
  );
}

/** cents to dollars, basis points to percentage, on the way out. */
function toResponse(liability: Liability): LiabilityResponse {
  return {
    ...liability,
    // The columns are cents and basis points; the row type says `number`.
    balance: MoneyUtils.fromCents(asCents(liability.balance)),
    interestRate: fromBasisPoints(asBasisPoints(liability.interestRate)),
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
  if (input.balance !== undefined) {
    row.balance = MoneyUtils.toCents(asDollars(input.balance));
  }
  if (input.interestRate !== undefined) {
    row.interestRate = toBasisPoints(asPercent(input.interestRate));
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
      balance: MoneyUtils.toCents(asDollars(input.balance)),
      interestRate: toBasisPoints(asPercent(input.interestRate)),
      dueDate: input.dueDate === undefined ? undefined : new Date(input.dueDate),
    },
  });

  return toResponse(liability);
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
