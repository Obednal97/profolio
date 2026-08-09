import { withRoute } from "@/server/http/handler";
import { DisableTwoFactorSchema } from "@/server/modules/auth/schemas";
import { disableTwoFactor } from "@/server/modules/auth/two-factor";

/** Turns 2FA off. Needs both the password and a current code. */
export const POST = withRoute({
  body: DisableTwoFactorSchema,
  handler: ({ body }) => disableTwoFactor(body),
});
