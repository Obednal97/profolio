import { NextResponse } from "next/server";
import { withRoute } from "@/server/http/handler";
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
    const result = await signIn(body);

    if ("requiresTwoFactor" in result) {
      return NextResponse.json(result);
    }

    return jsonWithSession(request, result, result.token);
  },
});
