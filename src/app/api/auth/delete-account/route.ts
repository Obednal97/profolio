import { withRoute } from "@/server/http/handler";
import { jsonClearingSession } from "@/server/auth/cookie";
import { deleteAccount } from "@/server/modules/auth/service";

/**
 * Deletes the signed-in user's account and all of their data.
 *
 * The settings page has always called this; it did not exist, so the delete
 * button returned the Next 404 page. The session cookie is cleared in the same
 * response - the token stays cryptographically valid for up to 24 hours, and
 * without this the browser would keep sending it for an account that is gone.
 */
export const DELETE = withRoute({
  handler: async ({ request }) => {
    const result = await deleteAccount();
    return jsonClearingSession(request, result);
  },
});
