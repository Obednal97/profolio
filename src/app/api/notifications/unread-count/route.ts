import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import { getUnreadCount } from "@/server/modules/notifications/service";

export const GET = withRoute({
  handler: async ({ request }) => {
    // A demo session has no notifications. Answering zero keeps the bell quiet
    // instead of leaving a failed request behind it.
    if (isDemoRequest(request)) return { count: 0 };

    return getUnreadCount();
  },
});
