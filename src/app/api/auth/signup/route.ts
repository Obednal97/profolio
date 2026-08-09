import { withRoute } from "@/server/http/handler";
import { jsonWithSession } from "@/server/auth/cookie";
import { SignUpSchema } from "@/server/modules/auth/schemas";
import { signUp } from "@/server/modules/auth/service";

/** Registration. Signs the new account straight in. */
export const POST = withRoute({
  body: SignUpSchema,
  handler: async ({ body, request }) => {
    const result = await signUp(body);
    return jsonWithSession(request, result, result.token);
  },
});
