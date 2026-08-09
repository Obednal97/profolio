import { withRoute } from "@/server/http/handler";
import { requireUser } from "@/server/auth/session";
import { SymbolQuerySchema } from "@/server/modules/market-data/schemas";
import { getOrQueueSymbol } from "@/server/modules/market-data/symbols";

/** Details for one symbol, queuing it for lookup if unknown. */
export const GET = withRoute({
  query: SymbolQuerySchema,
  handler: async ({ query }) => {
    const user = await requireUser();
    return { symbol: await getOrQueueSymbol(query.symbol, user.id) };
  },
});
