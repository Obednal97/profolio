import { withRoute } from "@/server/http/handler";
import { requireUser } from "@/server/auth/session";
import { SymbolParamSchema } from "@/server/modules/market-data/schemas";
import { findCachedPrice } from "@/server/modules/market-data/symbols";

/**
 * The last recorded price for a symbol, in dollars. No live provider call.
 *
 * A miss answers with `price: null`. The proxy this replaces returned
 * `price: 0` when it could not reach the backend, which the asset form
 * multiplied by quantity and presented as a valuation of zero.
 */
export const GET = withRoute({
  params: SymbolParamSchema,
  handler: async ({ params }) => {
    await requireUser();
    return findCachedPrice(params.symbol);
  },
});
