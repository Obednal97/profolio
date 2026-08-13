import { withRoute } from "@/server/http/handler";
import {
  CreateLiabilitySchema,
  LiabilityQuerySchema,
} from "@/server/modules/liabilities/schemas";
import {
  createLiability,
  listLiabilities,
} from "@/server/modules/liabilities/service";

/**
 * The caller's liabilities. Balances are in dollars both ways and interest
 * rates are percentages both ways - see the module's schemas.ts.
 */
export const GET = withRoute({
  query: LiabilityQuerySchema,
  handler: async ({ query }) => ({
    liabilities: await listLiabilities(query),
    error: null,
  }),
});

export const POST = withRoute({
  body: CreateLiabilitySchema,
  handler: async ({ body }) => ({
    liability: await createLiability(body),
    error: null,
  }),
});
