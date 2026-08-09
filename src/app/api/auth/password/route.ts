import { withRoute } from "@/server/http/handler";
import { ChangePasswordSchema } from "@/server/modules/auth/schemas";
import { changePassword } from "@/server/modules/auth/service";

/** Change an existing password, or set the first one on an OAuth account. */
export const PATCH = withRoute({
  body: ChangePasswordSchema,
  handler: ({ body }) => changePassword(body),
});
