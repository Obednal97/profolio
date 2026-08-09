import { withRoute } from "@/server/http/handler";
import { getTwoFactorStatus } from "@/server/modules/auth/two-factor";

/** Whether 2FA is on for the signed-in user, and how many codes remain. */
export const GET = withRoute({
  handler: () => getTwoFactorStatus(),
});
