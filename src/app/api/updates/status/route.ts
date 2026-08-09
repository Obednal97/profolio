import { withRoute } from "@/server/http/handler";
import { requireUser } from "@/server/auth/session";

/** See ../check/route.ts: self-update is permanently disabled. */
export const GET = withRoute({
  handler: async () => {
    await requireUser();

    return {
      status: "disabled",
      inProgress: false,
      message: "Self-update is disabled on this deployment.",
    };
  },
});
