import { withRoute } from "@/server/http/handler";
import { jsonWithSession } from "@/server/auth/cookie";
import { VerifyBackupCodeSchema } from "@/server/modules/auth/schemas";
import { completeWithBackupCode } from "@/server/modules/auth/two-factor";

/** Second step of sign-in when the authenticator is unavailable. */
export const POST = withRoute({
  body: VerifyBackupCodeSchema,
  handler: async ({ body, request }) => {
    const result = await completeWithBackupCode(body);
    return jsonWithSession(request, result, result.token);
  },
});
