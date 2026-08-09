import "server-only";
import { z } from "zod";
import { blankable, isoDate } from "@/server/http/zod";

/**
 * Request schemas for properties.
 *
 * THE WIRE FORMAT: money arrives and leaves in DOLLARS, stored as integer
 * cents. `mortgageRate` is a percentage stored as a decimal, and `bathrooms`
 * allows a half.
 *
 * The DTO converted with `value ? Math.round(value * 100) : undefined`, which
 * turns a legitimate zero into "field not provided" - so a property with no
 * mortgage, no HOA or no rental income could not record that fact, and the old
 * value survived an edit that was meant to clear it.
 */

/** A money amount in dollars. */
const Money = z.number().min(0).max(9_999_999_999);

/** An integer count, e.g. bedrooms or square footage. */
const Count = z.number().int().min(0).max(1_000_000);

const currentYear = new Date().getUTCFullYear();

export const CreatePropertySchema = z
  .object({
    address: z.string().trim().min(1).max(500),
    street: blankable(z.string().trim().max(255)),
    city: blankable(z.string().trim().max(120)),
    region: blankable(z.string().trim().max(120)),
    postalCode: blankable(z.string().trim().max(20)),
    country: blankable(z.string().trim().max(120)),

    propertyType: blankable(z.string().trim().max(60)),
    ownershipType: blankable(z.string().trim().max(60)),
    status: blankable(z.string().trim().max(60)),

    bedrooms: Count.optional(),
    /** Half bathrooms are real; the column is Decimal(3,1). */
    bathrooms: z.number().min(0).max(99).multipleOf(0.5).optional(),
    squareFootage: Count.optional(),
    yearBuilt: z.number().int().min(1000).max(currentYear).optional(),
    lotSize: Count.optional(),

    currentValue: Money.optional(),
    purchasePrice: Money.optional(),
    purchaseDate: blankable(isoDate),

    mortgageAmount: Money.optional(),
    /** Annual percentage, e.g. 4.25. */
    mortgageRate: z.number().min(0).max(100).optional(),
    /** Months. */
    mortgageTerm: z.number().int().min(1).max(1200).optional(),
    monthlyPayment: Money.optional(),
    mortgageProvider: blankable(z.string().trim().max(120)),
    mortgageStartDate: blankable(isoDate),

    propertyTaxes: Money.optional(),
    insurance: Money.optional(),
    maintenanceCosts: Money.optional(),
    hoa: Money.optional(),

    rentalIncome: Money.optional(),
    monthlyRent: Money.optional(),
    securityDeposit: Money.optional(),
    rentalStartDate: blankable(isoDate),
    rentalEndDate: blankable(isoDate),

    notes: blankable(z.string().trim().max(2000)),
  })
  .strict();
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;

export const UpdatePropertySchema = CreatePropertySchema.partial().strict();
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;

export const PropertyQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(500).default(50),
  })
  .strict();
export type PropertyQuery = z.infer<typeof PropertyQuerySchema>;

export const PropertyIdSchema = z.object({ id: z.uuid() }).strict();
