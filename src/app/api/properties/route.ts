import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import { generateDemoProperties } from "@/lib/demoData";
import {
  CreatePropertySchema,
  PropertyQuerySchema,
} from "@/server/modules/properties/schemas";
import {
  createProperty,
  listProperties,
} from "@/server/modules/properties/service";

/** The caller's properties. Money is in dollars both ways. */
export const GET = withRoute({
  query: PropertyQuerySchema,
  handler: async ({ query, request }) => {
    if (isDemoRequest(request)) {
      return { properties: generateDemoProperties(), error: null };
    }

    return { properties: await listProperties(query), error: null };
  },
});

export const POST = withRoute({
  body: CreatePropertySchema,
  handler: async ({ body, request }) => {
    if (isDemoRequest(request)) {
      return {
        property: { ...body, id: "demo-property", userId: "demo-user-id" },
        error: null,
      };
    }

    return { property: await createProperty(body), error: null };
  },
});
