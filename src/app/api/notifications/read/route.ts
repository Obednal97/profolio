import { withRoute } from "@/server/http/handler";
import { deleteReadNotifications } from "@/server/modules/notifications/service";

/**
 * Clears notifications that have already been read.
 *
 * A static segment, so it wins over `[id]` in the App Router's matching -
 * which is the same reason the NestJS controller had to declare
 * `@Delete('read')` before `@Delete(':id')`, or "read" was taken as an id.
 */
export const DELETE = withRoute({
  handler: () => deleteReadNotifications(),
});
