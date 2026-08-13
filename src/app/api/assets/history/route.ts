import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import { HistoryQuerySchema } from "@/server/modules/assets/schemas";
import { getAssetHistory } from "@/server/modules/assets/service";

/**
 * Portfolio value over time, from recorded prices only.
 *
 * The previous implementation returned a sine wave plus `Math.random()` around
 * a hardcoded $10,000, which the performance chart displayed as the user's own
 * history. An empty series is the correct answer when nothing has been priced.
 */
export const GET = withRoute({
  query: HistoryQuerySchema,
  handler: async ({ query, request }) => {
    // A demo session has no recorded prices, so the honest answer is an empty
    // series. It used to be a 401, which the chart surfaced as a broken panel
    // in the middle of an otherwise working demo.
    if (isDemoRequest(request)) return { history: [] };

    return { history: await getAssetHistory(query.days) };
  },
});
