import { withRoute } from "@/server/http/handler";
import { requireUser } from "@/server/auth/session";
import { SearchQuerySchema } from "@/server/modules/market-data/schemas";
import { queueSymbol, searchSymbols } from "@/server/modules/market-data/symbols";

/** Symbol search over the catalogue, queuing an unknown ticker for lookup. */
export const GET = withRoute({
  query: SearchQuerySchema,
  handler: async ({ query }) => {
    const user = await requireUser();

    if (query.q.length === 0) {
      return { symbols: [], message: "Enter a search term" };
    }

    const symbols = await searchSymbols(query.q, query.limit);
    if (symbols.length > 0) {
      return { symbols, count: symbols.length };
    }

    const candidate = query.q.toUpperCase().trim();
    if (/^[A-Z0-9]{1,5}(\.[A-Z]{1,2})?$/.test(candidate)) {
      await queueSymbol(candidate, user.id);
      return {
        symbols: [
          {
            symbol: candidate,
            name: `${candidate} (queued for lookup)`,
            type: "STOCK",
            is_queued: true,
          },
        ],
        message: `"${candidate}" has been queued. Its price will appear after the next sync.`,
      };
    }

    return {
      symbols: [],
      message: `Nothing found for "${query.q}". Try a ticker such as AAPL.`,
    };
  },
});
