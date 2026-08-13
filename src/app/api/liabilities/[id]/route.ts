import { withRoute } from "@/server/http/handler";
import {
  LiabilityIdSchema,
  UpdateLiabilitySchema,
} from "@/server/modules/liabilities/schemas";
import {
  deleteLiability,
  getLiability,
  updateLiability,
} from "@/server/modules/liabilities/service";

export const GET = withRoute({
  params: LiabilityIdSchema,
  handler: ({ params }) => getLiability(params.id),
});

/** Partial update. Sending one field is enough. */
export const PATCH = withRoute({
  params: LiabilityIdSchema,
  body: UpdateLiabilitySchema,
  handler: ({ params, body }) => updateLiability(params.id, body),
});

export const DELETE = withRoute({
  params: LiabilityIdSchema,
  handler: ({ params }) => deleteLiability(params.id),
});
