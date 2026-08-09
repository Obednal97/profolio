import { withRoute } from "@/server/http/handler";
import { requireAdmin } from "@/server/auth/session";
import { getSymbolStatistics } from "@/server/modules/market-data/symbols";

/**
 * Catalogue statistics. Administrators only - it reports platform-wide
 * counts, which is not a signed-in user's business.
 */
export const GET = withRoute({
  handler: async () => {
    await requireAdmin();
    return { status: "OK", ...(await getSymbolStatistics()) };
  },
});
