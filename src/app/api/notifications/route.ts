import { withRoute } from "@/server/http/handler";
import {
  NotificationQuerySchema,
  listNotifications,
} from "@/server/modules/notifications/service";

/** The caller's notifications, newest and highest priority first. */
export const GET = withRoute({
  query: NotificationQuerySchema,
  handler: ({ query }) => listNotifications(query),
});
