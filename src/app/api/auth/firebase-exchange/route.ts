import { withRoute } from "@/server/http/handler";
import { limit, RATE_LIMITS } from "@/server/http/rate-limit";
import { jsonWithSession } from "@/server/auth/cookie";
import { FirebaseExchangeSchema } from "@/server/modules/auth/schemas";
import { exchangeFirebaseToken } from "@/server/modules/auth/firebase";

/**
 * Exchanges a verified Firebase ID token for a first-party session.
 *
 * The cookie is issued through the shared helper. Setting it inline here is
 * how it came to have a 30-day lifetime for a 24-hour token, and a `secure`
 * flag derived from NODE_ENV that a plain-HTTP self-hosted install could never
 * satisfy.
 */
export const POST = withRoute({
  body: FirebaseExchangeSchema,
  handler: async ({ body, request }) => {
    // Thirty per address per five minutes. Every Firebase sign-in and token
    // refresh comes through here, so a tight limit would break normal use; the
    // number is set to protect the Admin SDK verification behind it.
    await limit(request, RATE_LIMITS.firebaseExchange);

    const result = await exchangeFirebaseToken(body.firebaseToken);
    return jsonWithSession(request, result, result.token);
  },
});
