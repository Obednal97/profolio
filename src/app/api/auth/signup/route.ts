import { withRoute } from "@/server/http/handler";
import { limit, RATE_LIMITS } from "@/server/http/rate-limit";
import { jsonWithSession } from "@/server/auth/cookie";
import { SignUpSchema } from "@/server/modules/auth/schemas";
import { signUp } from "@/server/modules/auth/service";

/** Registration. Signs the new account straight in. */
export const POST = withRoute({
  body: SignUpSchema,
  handler: async ({ body, request }) => {
    // Ten an hour per address. Nobody registers twice, so anything past a
    // household's worth of accounts from one address is bulk creation.
    await limit(request, RATE_LIMITS.signUp);

    const result = await signUp(body);
    return jsonWithSession(request, result, result.token);
  },
});
