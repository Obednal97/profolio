import "server-only";
import { z } from "zod";
import { AssetType, InterestType, PaymentFrequency } from "@prisma/client";
import { blankable, isoDate } from "@/server/http/zod";

/**
 * Request schemas for assets.
 *
 * THE WIRE FORMAT, which the DTOs never wrote down:
 *  - money arrives and leaves in DOLLARS; the database stores integer cents
 *  - `current_value` is the TOTAL value of the position, not a unit price -
 *    the asset form computes price x quantity before sending it
 *  - interest rates arrive as percentages and are stored as basis points
 *  - the snake_case names (current_value, purchase_price, purchase_date,
 *    vesting_*) match both the database columns and what the client sends
 */

/**
 * The asset form has always used lowercase type names ("stock", "crypto")
 * while the database enum is upper case. `@IsEnum(AssetType)` rejected them,
 * so creating an asset from the UI failed validation outright. Accept either
 * and normalise, rather than leaving the two ends to agree by luck.
 */
const AssetTypeSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(AssetType));

const InterestTypeSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(InterestType));

const PaymentFrequencySchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(PaymentFrequency));

/** A money amount in dollars. */
const Money = z.number().min(0).max(9_999_999_999);

export const CreateAssetSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    type: AssetTypeSchema,
    symbol: blankable(
      z
        .string()
        .trim()
        .toUpperCase()
        .max(20)
        .regex(
          /^[A-Z0-9.-]+$/,
          "Symbol may contain only letters, numbers, dots and hyphens",
        ),
    ),
    quantity: z.number().min(0).max(999_999_999).default(0),
    currency: blankable(z.string().trim().toUpperCase().length(3)),
    source: blankable(z.string().trim().max(100)),
    externalId: blankable(z.string().trim().max(100)),

    current_value: Money.optional(),
    valueOverride: Money.optional(),
    purchase_price: Money.optional(),
    purchase_date: blankable(isoDate),

    // Savings
    initialAmount: Money.optional(),
    /** Percent, e.g. 4.5. Stored as basis points. */
    interestRate: z.number().min(0).max(100).optional(),
    interestType: blankable(InterestTypeSchema),
    paymentFrequency: blankable(PaymentFrequencySchema),
    termLength: z.number().int().min(1).max(600).optional(),
    maturityDate: blankable(isoDate),

    // Equity
    vesting_start_date: blankable(isoDate),
    vesting_end_date: blankable(isoDate),
    vesting_schedule: z
      .object({
        initial: z.string().optional(),
        monthly: z.string().optional(),
      })
      .strict()
      .nullish(),

    notes: blankable(z.string().trim().max(1000)),
    autoSync: z.boolean().optional(),
  })
  .strict();
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;

/**
 * Every field optional, so a single-field PATCH works. `quantity` loses its
 * default here: defaulting it on update would zero the holding of anyone who
 * only meant to rename an asset.
 */
export const UpdateAssetSchema = CreateAssetSchema.partial()
  .extend({ quantity: z.number().min(0).max(999_999_999).optional() })
  .strict();
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;

export const AssetQuerySchema = z
  .object({ type: blankable(AssetTypeSchema) })
  .strict();

export const AssetIdSchema = z.object({ id: z.uuid() }).strict();

export const HistoryQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(3650).default(30),
  })
  .strict();
