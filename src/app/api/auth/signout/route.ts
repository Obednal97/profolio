import { withRoute } from "@/server/http/handler";
import { jsonClearingSession } from "@/server/auth/cookie";

/**
 * Ends the session.
 *
 * The auth cookie is httpOnly, so the client cannot clear it itself - this is
 * the only way out. Tokens are stateless, so there is nothing to revoke
 * server-side and the request always succeeds; a user asking to sign out must
 * never be left signed in because something else failed.
 */
export const POST = withRoute({
  handler: async ({ request }) =>
    jsonClearingSession(request, { success: true }),
});
