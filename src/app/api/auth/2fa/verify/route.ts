import { withRoute } from "@/server/http/handler";
import { VerifyTwoFactorSchema } from "@/server/modules/auth/schemas";
import { enableTwoFactor } from "@/server/modules/auth/two-factor";

/** Confirms setup with a code from the authenticator, and enables 2FA. */
export const POST = withRoute({
  body: VerifyTwoFactorSchema,
  handler: ({ body }) => enableTwoFactor(body.code),
});
