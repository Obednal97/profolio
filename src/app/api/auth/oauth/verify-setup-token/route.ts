import { withRoute } from "@/server/http/handler";
import { limit, RATE_LIMITS } from "@/server/http/rate-limit";
import { VerifySetupTokenSchema } from "@/server/modules/auth/schemas";
import { verifySetupToken } from "@/server/modules/auth/oauth-password";

/** Checks a password setup link before showing the form behind it. */
export const POST = withRoute({
  body: VerifySetupTokenSchema,
  handler: async ({ body, request }) => {
    // Twenty per address per ten minutes. The token itself is unguessable, so
    // the limit is there to stop the endpoint being polled as an oracle for
    // which links are still live, while leaving room for a page that checks on
    // load and a user who refreshes it.
    await limit(request, RATE_LIMITS.verifySetupToken);

    return verifySetupToken(body.token);
  },
});
