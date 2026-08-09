import { withRoute } from "@/server/http/handler";
import {
  CheckoutSchema,
  createCheckoutSession,
} from "@/server/modules/billing/service";

export const POST = withRoute({
  body: CheckoutSchema,
  handler: ({ body }) => createCheckoutSession(body),
});
