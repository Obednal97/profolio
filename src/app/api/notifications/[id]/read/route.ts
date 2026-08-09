import { withRoute } from "@/server/http/handler";
import {
  NotificationIdSchema,
  markAsRead,
} from "@/server/modules/notifications/service";

export const PUT = withRoute({
  params: NotificationIdSchema,
  handler: ({ params }) => markAsRead(params.id),
});
