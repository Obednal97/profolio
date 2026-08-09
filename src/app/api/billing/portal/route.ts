import { withRoute } from "@/server/http/handler";
import {
  PortalSchema,
  createPortalSession,
} from "@/server/modules/billing/service";

export const POST = withRoute({
  body: PortalSchema,
  handler: ({ body }) => createPortalSession(body.returnUrl),
});
