import { withRoute } from "@/server/http/handler";
import { requireUser } from "@/server/auth/session";

/**
 * The self-update feature is permanently disabled.
 *
 * The NestJS module it proxied to drove `git`, `npm` and `systemctl` through
 * child_process against the machine it was running on. That has no meaning on
 * a managed platform, and it is not something this application should be able
 * to do to a self-hosted machine either. The module is deleted; this endpoint
 * remains so the updates page gets a clear answer instead of a 404.
 */
export const GET = withRoute({
  handler: async () => {
    await requireUser();

    return {
      updateAvailable: false,
      disabled: true,
      message:
        "Self-update is disabled. Update through your deployment platform " +
        "or by pulling the repository.",
    };
  },
});
