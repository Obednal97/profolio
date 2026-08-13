import { withRoute } from "@/server/http/handler";
import { limit, RATE_LIMITS } from "@/server/http/rate-limit";
import { SetPasswordSchema } from "@/server/modules/auth/schemas";
import { setPasswordWithToken } from "@/server/modules/auth/oauth-password";

/**
 * Sets a password from a setup link. Deliberately unauthenticated: the token
 * is the credential, and the account it belongs to has no password yet.
 */
export const POST = withRoute({
  body: SetPasswordSchema,
  handler: async ({ body, request }) => {
    // Ten an hour per address. This writes a credential to an account that has
    // none yet and a legitimate user does it once. Passwords the schema
    // rejects never reach here, so a user fixing a weak password does not
    // spend attempts.
    await limit(request, RATE_LIMITS.setPassword);

    return setPasswordWithToken(body);
  },
});
