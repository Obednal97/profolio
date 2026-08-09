import { withRoute } from "@/server/http/handler";
import { requireAdmin } from "@/server/auth/session";
import { syncAllPrices } from "@/server/modules/market-data/price-sync";

/**
 * Runs a price sync on demand.
 *
 * Administrators only. The NestJS controller documented this as admin-only but
 * carried no role check, so any signed-in user could trigger provider traffic.
 */
export const POST = withRoute({
  handler: async () => {
    await requireAdmin();
    return { success: true, ...(await syncAllPrices()) };
  },
});
