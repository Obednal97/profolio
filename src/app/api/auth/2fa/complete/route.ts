import { withRoute } from "@/server/http/handler";
import { limit, RATE_LIMITS } from "@/server/http/rate-limit";
import { jsonWithSession } from "@/server/auth/cookie";
import { CompleteTwoFactorSchema } from "@/server/modules/auth/schemas";
import { completeTwoFactorSignIn } from "@/server/modules/auth/two-factor";

/** Second step of sign-in: the code from the authenticator app. */
export const POST = withRoute({
  body: CompleteTwoFactorSchema,
  handler: async ({ body, request }) => {
    // Five per address per five minutes, pooled with the backup-code route.
    // Six digits is a million combinations; one attempt a minute needs about a
    // year to reach an even chance of guessing one, and a person copying a
    // code off their phone needs two or three tries.
    await limit(request, RATE_LIMITS.twoFactor);

    const result = await completeTwoFactorSignIn(body);
    return jsonWithSession(request, result, result.token);
  },
});
