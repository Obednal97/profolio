import { withRoute } from "@/server/http/handler";
import { requestPasswordSetup } from "@/server/modules/auth/oauth-password";

/** Sends an OAuth-only account a link for setting an email password. */
export const POST = withRoute({
  handler: () => requestPasswordSetup(),
});
