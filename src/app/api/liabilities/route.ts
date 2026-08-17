import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import { generateDemoLiabilities } from "@/lib/demoData";
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
 *
 * A demo session gets generated debts, as it already does for assets, expenses
 * and properties. Returning nothing here left the demo dashboard showing a net
 * worth with no debt side, which made the figure look better than the demo
 * portfolio it was built from.
 */
export const GET = withRoute({
  query: LiabilityQuerySchema,
  handler: async ({ query, request }) => {
    if (isDemoRequest(request)) {
      return { liabilities: generateDemoLiabilities(), error: null };
    }

    return { liabilities: await listLiabilities(query), error: null };
  },
});

export const POST = withRoute({
  body: CreateLiabilitySchema,
  handler: async ({ body, request }) => {
    if (isDemoRequest(request)) {
      // Demo sessions are read-only; echo it back so the UI can show it
      // without pretending it was stored.
      return {
        liability: {
          ...body,
          id: "demo-liability",
          userId: "demo-user-id",
          dueDate: body.dueDate ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        error: null,
      };
    }

    return { liability: await createLiability(body), error: null };
  },
});
