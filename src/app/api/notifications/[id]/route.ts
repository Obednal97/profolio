import { withRoute } from "@/server/http/handler";
import {
  NotificationIdSchema,
  deleteNotification,
} from "@/server/modules/notifications/service";

export const DELETE = withRoute({
  params: NotificationIdSchema,
  handler: ({ params }) => deleteNotification(params.id),
});
