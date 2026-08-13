import { NextResponse } from "next/server";
import { withRoute } from "@/server/http/handler";
import { limit, RATE_LIMITS } from "@/server/http/rate-limit";
import { jsonWithSession } from "@/server/auth/cookie";
import { SignInSchema } from "@/server/modules/auth/schemas";
import { signIn } from "@/server/modules/auth/service";

/**
 * Email and password sign-in.
 *
 * When the account has 2FA the response carries a verification token and no
 * session cookie: the browser is not signed in until /api/auth/2fa/complete
 * or /api/auth/2fa/backup succeeds.
 */
export const POST = withRoute({
  body: SignInSchema,
  handler: async ({ body, request }) => {
    // Ten per address per five minutes: enough for a mistyped password, and
    // it also throttles how fast an attacker can mint 2FA verification
    // tokens by repeating a password they already know.
    await limit(request, RATE_LIMITS.signIn);

    const result = await signIn(body);

    if ("requiresTwoFactor" in result) {
      return NextResponse.json(result);
    }

    return jsonWithSession(request, result, result.token);
  },
});
