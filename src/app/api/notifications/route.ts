import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import {
  NotificationQuerySchema,
  listNotifications,
} from "@/server/modules/notifications/service";

/** The caller's notifications, newest and highest priority first. */
export const GET = withRoute({
  query: NotificationQuerySchema,
  handler: ({ query, request }) => {
    if (isDemoRequest(request)) {
      return Promise.resolve({
        notifications: [],
        totalCount: 0,
        unreadCount: 0,
        hasMore: false,
      });
    }

    return listNotifications(query);
  },
});
