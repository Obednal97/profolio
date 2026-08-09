import { withRoute } from "@/server/http/handler";
import { RegenerateBackupCodesSchema } from "@/server/modules/auth/schemas";
import { regenerateBackupCodes } from "@/server/modules/auth/two-factor";

/** Replaces every backup code. The old ones stop working immediately. */
export const POST = withRoute({
  body: RegenerateBackupCodesSchema,
  handler: ({ body }) => regenerateBackupCodes(body),
});
