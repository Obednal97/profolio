import "server-only";
import type { Prisma, Property } from "@prisma/client";
import { prisma } from "@/server/db";
import { MoneyUtils } from "@/server/money";
import { asCents, asDollars } from "@/lib/moneyUnits";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { NotFound } from "@/server/http/errors";
import type {
  CreatePropertyInput,
  PropertyQuery,
  UpdatePropertyInput,
} from "./schemas";

/**
 * Properties. Money is dollars on the wire, integer cents at rest.
 */

/** The columns held in cents. Everything else passes through untouched. */
const MONEY_FIELDS = [
  "currentValue",
  "purchasePrice",
  "rentalIncome",
  "mortgageAmount",
  "monthlyPayment",
  "propertyTaxes",
  "insurance",
  "maintenanceCosts",
  "hoa",
  "monthlyRent",
  "securityDeposit",
] as const;

const DATE_FIELDS = [
  "purchaseDate",
  "mortgageStartDate",
  "rentalStartDate",
  "rentalEndDate",
] as const;

type MoneyField = (typeof MONEY_FIELDS)[number];

export type PropertyResponse = Omit<Property, MoneyField | "mortgageRate" | "bathrooms"> &
  Record<MoneyField, number | null> & {
    mortgageRate: number | null;
    bathrooms: number | null;
  };

/**
 * cents -> dollars on the way out.
 *
 * The conversion tests each field against null rather than for truthiness, so
 * a stored zero reads back as 0 rather than null - "this property has no
 * mortgage" is information, and the previous `value ? value / 100 : null`
 * threw it away.
 */
function toResponse(property: Property): PropertyResponse {
  const converted = {} as Record<MoneyField, number | null>;
  for (const field of MONEY_FIELDS) {
    const value = property[field];
    // The money columns are integer cents; the row type says `number`.
    converted[field] =
      value === null ? null : MoneyUtils.fromCents(asCents(value));
  }

  return {
    ...property,
    ...converted,
    // Prisma returns Decimal instances for these; the client wants numbers.
    mortgageRate:
      property.mortgageRate === null ? null : Number(property.mortgageRate),
    bathrooms: property.bathrooms === null ? null : Number(property.bathrooms),
  };
}

/**
 * dollars -> cents on the way in, and ISO strings -> Date.
 *
 * Only keys actually present in the input are copied, so a PATCH cannot
 * blank a field the caller did not mention.
 */
function toRow(
  input: CreatePropertyInput | UpdatePropertyInput,
): Prisma.PropertyUncheckedUpdateInput {
  const row: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    row[key] = value;
  }

  for (const field of MONEY_FIELDS) {
    const value = input[field];
    // Validated request fields, which this module takes in dollars.
    if (value !== undefined) row[field] = MoneyUtils.toCents(asDollars(value));
  }

  for (const field of DATE_FIELDS) {
    const value = input[field];
    if (value !== undefined) row[field] = new Date(value);
  }

  return row as Prisma.PropertyUncheckedUpdateInput;
}

export async function createProperty(
  input: CreatePropertyInput,
): Promise<PropertyResponse> {
  const user = await requireUser();
  assertNotDemo(user);

  const property = await prisma.property.create({
    data: {
      ...(toRow(input) as Prisma.PropertyUncheckedCreateInput),
      userId: user.id,
      address: input.address,
    },
  });

  return toResponse(property);
}

export async function listProperties(
  query: PropertyQuery,
): Promise<PropertyResponse[]> {
  const user = await requireUser();

  const properties = await prisma.property.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: query.limit,
  });

  return properties.map(toResponse);
}

export async function getProperty(id: string): Promise<PropertyResponse> {
  const user = await requireUser();

  const property = await prisma.property.findFirst({
    where: { id, userId: user.id },
  });
  if (!property) throw new NotFound("Property not found");

  return toResponse(property);
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput,
): Promise<PropertyResponse> {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.property.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Property not found");

  const property = await prisma.property.update({
    where: { id },
    data: toRow(input),
  });

  return toResponse(property);
}

export async function deleteProperty(id: string): Promise<{ success: true }> {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.property.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Property not found");

  await prisma.property.delete({ where: { id } });

  return { success: true };
}
