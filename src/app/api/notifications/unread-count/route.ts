import { withRoute } from "@/server/http/handler";
import { getUnreadCount } from "@/server/modules/notifications/service";

export const GET = withRoute({
  handler: () => getUnreadCount(),
});
