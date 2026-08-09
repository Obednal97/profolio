import { withRoute } from "@/server/http/handler";
import { SetupTwoFactorSchema } from "@/server/modules/auth/schemas";
import { startTwoFactorSetup } from "@/server/modules/auth/two-factor";

/** Begins 2FA setup. Returns the QR code, secret and backup codes once. */
export const POST = withRoute({
  body: SetupTwoFactorSchema,
  handler: ({ body }) => startTwoFactorSetup(body.password),
});
