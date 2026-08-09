import { withRoute } from "@/server/http/handler";
import { jsonWithSession } from "@/server/auth/cookie";
import { CompleteTwoFactorSchema } from "@/server/modules/auth/schemas";
import { completeTwoFactorSignIn } from "@/server/modules/auth/two-factor";

/** Second step of sign-in: the code from the authenticator app. */
export const POST = withRoute({
  body: CompleteTwoFactorSchema,
  handler: async ({ body, request }) => {
    const result = await completeTwoFactorSignIn(body);
    return jsonWithSession(request, result, result.token);
  },
});
