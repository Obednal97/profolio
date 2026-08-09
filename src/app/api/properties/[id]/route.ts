import { withRoute } from "@/server/http/handler";
import {
  PropertyIdSchema,
  UpdatePropertySchema,
} from "@/server/modules/properties/schemas";
import {
  deleteProperty,
  getProperty,
  updateProperty,
} from "@/server/modules/properties/service";

export const GET = withRoute({
  params: PropertyIdSchema,
  handler: ({ params }) => getProperty(params.id),
});

export const PATCH = withRoute({
  params: PropertyIdSchema,
  body: UpdatePropertySchema,
  handler: ({ params, body }) => updateProperty(params.id, body),
});

export const DELETE = withRoute({
  params: PropertyIdSchema,
  handler: ({ params }) => deleteProperty(params.id),
});
