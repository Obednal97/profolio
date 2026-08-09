import { withRoute } from "@/server/http/handler";
import {
  AdminUserIdSchema,
  deleteUser,
  getUser,
} from "@/server/modules/admin/service";

export const GET = withRoute({
  params: AdminUserIdSchema,
  handler: ({ params }) => getUser(params.id),
});

export const DELETE = withRoute({
  params: AdminUserIdSchema,
  handler: ({ params }) => deleteUser(params.id),
});
