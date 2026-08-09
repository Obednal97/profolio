import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import { generateDemoAssets } from "@/lib/demoData";
import {
  AssetQuerySchema,
  CreateAssetSchema,
} from "@/server/modules/assets/schemas";
import { createAsset, listAssets } from "@/server/modules/assets/service";

/**
 * The caller's assets.
 *
 * The `{ assets, error }` envelope is what the asset manager and the dashboard
 * already read, so it is preserved rather than tidied.
 */
export const GET = withRoute({
  query: AssetQuerySchema,
  handler: async ({ query, request }) => {
    if (isDemoRequest(request)) {
      return { assets: generateDemoAssets(), error: null };
    }

    return { assets: await listAssets(query), error: null };
  },
});

export const POST = withRoute({
  body: CreateAssetSchema,
  handler: async ({ body, request }) => {
    if (isDemoRequest(request)) {
      // Demo sessions are read-only; echo the asset back so the UI can show it
      // without pretending it was stored.
      return { asset: { ...body, id: "demo-asset", userId: "demo-user-id" }, error: null };
    }

    return { asset: await createAsset(body), error: null };
  },
});
