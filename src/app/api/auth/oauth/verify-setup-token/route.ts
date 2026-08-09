import { withRoute } from "@/server/http/handler";
import { VerifySetupTokenSchema } from "@/server/modules/auth/schemas";
import { verifySetupToken } from "@/server/modules/auth/oauth-password";

/** Checks a password setup link before showing the form behind it. */
export const POST = withRoute({
  body: VerifySetupTokenSchema,
  handler: ({ body }) => verifySetupToken(body.token),
});
