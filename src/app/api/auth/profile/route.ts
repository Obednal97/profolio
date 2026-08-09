import { withRoute } from "@/server/http/handler";
import { UpdateProfileSchema } from "@/server/modules/auth/schemas";
import { getProfile, updateProfile } from "@/server/modules/auth/service";

/** The signed-in user's profile. */
export const GET = withRoute({
  handler: () => getProfile(),
});

/** Partial update of the signed-in user's own profile. */
export const PATCH = withRoute({
  body: UpdateProfileSchema,
  handler: ({ body }) => updateProfile(body),
});
