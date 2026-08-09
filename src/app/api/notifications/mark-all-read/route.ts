import { withRoute } from "@/server/http/handler";
import { markAllAsRead } from "@/server/modules/notifications/service";

export const PUT = withRoute({
  handler: () => markAllAsRead(),
});
