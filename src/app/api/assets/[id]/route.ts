import { withRoute } from "@/server/http/handler";
import {
  AssetIdSchema,
  UpdateAssetSchema,
} from "@/server/modules/assets/schemas";
import {
  deleteAsset,
  getAsset,
  updateAsset,
} from "@/server/modules/assets/service";

/**
 * A single asset.
 *
 * This file did not exist. `useAssets`, `useUpdateAsset`, `useDeleteAsset` and
 * the asset manager's edit and delete buttons all addressed
 * `/api/assets/{id}`, and every one of them received the Next 404 page.
 */

export const GET = withRoute({
  params: AssetIdSchema,
  handler: ({ params }) => getAsset(params.id),
});

export const PATCH = withRoute({
  params: AssetIdSchema,
  body: UpdateAssetSchema,
  handler: ({ params, body }) => updateAsset(params.id, body),
});

export const DELETE = withRoute({
  params: AssetIdSchema,
  handler: ({ params }) => deleteAsset(params.id),
});
