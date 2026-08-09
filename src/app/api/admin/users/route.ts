import { withRoute } from "@/server/http/handler";
import {
  CreateUserSchema,
  createUser,
  listUsers,
} from "@/server/modules/admin/service";

export const GET = withRoute({
  handler: () => listUsers(),
});

export const POST = withRoute({
  body: CreateUserSchema,
  handler: ({ body }) => createUser(body),
});
