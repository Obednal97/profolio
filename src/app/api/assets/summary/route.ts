import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import { getDemoPortfolioSummary } from "@/lib/demoData";
import { getAssetSummary } from "@/server/modules/assets/service";

/** Totals, allocation by type and the best performing holdings. */
export const GET = withRoute({
  handler: async ({ request }) => {
    if (isDemoRequest(request)) {
      return getDemoPortfolioSummary();
    }

    return getAssetSummary();
  },
});
