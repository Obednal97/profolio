import { withRoute } from "@/server/http/handler";
import { SetPasswordSchema } from "@/server/modules/auth/schemas";
import { setPasswordWithToken } from "@/server/modules/auth/oauth-password";

/**
 * Sets a password from a setup link. Deliberately unauthenticated: the token
 * is the credential, and the account it belongs to has no password yet.
 */
export const POST = withRoute({
  body: SetPasswordSchema,
  handler: ({ body }) => setPasswordWithToken(body),
});
