import { withRoute } from "@/server/http/handler";
import { requireUser } from "@/server/auth/session";
import { TopSymbolsQuerySchema } from "@/server/modules/market-data/schemas";
import { getTopSymbols } from "@/server/modules/market-data/symbols";

/** The largest symbols of a given type that have a recorded price. */
export const GET = withRoute({
  query: TopSymbolsQuerySchema,
  handler: async ({ query }) => {
    await requireUser();

    const type = query.type ?? "STOCK";
    const symbols = await getTopSymbols(type, query.limit);

    return { symbols, type, count: symbols.length };
  },
});
