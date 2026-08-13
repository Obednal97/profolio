import { withRoute } from "@/server/http/handler";
import { limit, RATE_LIMITS } from "@/server/http/rate-limit";
import { jsonWithSession } from "@/server/auth/cookie";
import { VerifyBackupCodeSchema } from "@/server/modules/auth/schemas";
import { completeWithBackupCode } from "@/server/modules/auth/two-factor";

/** Second step of sign-in when the authenticator is unavailable. */
export const POST = withRoute({
  body: VerifyBackupCodeSchema,
  handler: async ({ body, request }) => {
    // The same five in five minutes as the authenticator route, and the same
    // bucket, so alternating between the two does not buy extra attempts.
    // This path also bcrypt-compares up to ten stored hashes per request,
    // roughly a second of CPU, which the ceiling keeps in check as well.
    await limit(request, RATE_LIMITS.twoFactor);

    const result = await completeWithBackupCode(body);
    return jsonWithSession(request, result, result.token);
  },
});
