import { withRoute } from "@/server/http/handler";
import {
  cancelSubscription,
  getSubscription,
} from "@/server/modules/billing/service";

/** Null when there is no subscription, rather than an error. */
export const GET = withRoute({
  handler: async () => ({ subscription: await getSubscription() }),
});

/** Cancels at the end of the paid period. */
export const DELETE = withRoute({
  handler: () => cancelSubscription(),
});
