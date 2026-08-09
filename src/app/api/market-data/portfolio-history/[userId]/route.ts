import { withRoute } from "@/server/http/handler";
import { requireUser } from "@/server/auth/session";
import { Forbidden } from "@/server/http/errors";
import { MoneyUtils } from "@/server/money";
import { getAssetHistory } from "@/server/modules/assets/service";
import {
  PortfolioHistoryParamsSchema,
  PortfolioHistoryQuerySchema,
} from "@/server/modules/market-data/schemas";

/**
 * Portfolio value over time.
 *
 * The `:userId` segment used to be trusted outright, so any signed-in user
 * could read anyone else's portfolio by editing the URL. It is kept because
 * the asset manager builds the URL that way, but it must now match the caller.
 *
 * `total_value` is in cents here, unlike `/api/assets/history` which reports
 * dollars. That is the shape the chart already parses.
 */
export const GET = withRoute({
  params: PortfolioHistoryParamsSchema,
  query: PortfolioHistoryQuerySchema,
  handler: async ({ params, query }) => {
    const user = await requireUser();

    if (params.userId !== user.id) {
      throw new Forbidden("You may only read your own portfolio history");
    }

    const history = await getAssetHistory(query.days);

    return {
      status: "OK",
      data: history.map((point) => ({
        date: point.date,
        total_value: MoneyUtils.toCents(point.totalValue),
      })),
    };
  },
});
