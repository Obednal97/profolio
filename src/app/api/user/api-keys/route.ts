import { z } from "zod";
import { withRoute } from "@/server/http/handler";
import {
  listApiKeysMasked,
  saveApiKeys,
} from "@/server/modules/api-keys/service";

/**
 * The signed-in user's third-party API keys, as a map of provider to masked
 * value. Keys are stored encrypted and the plaintext is never returned.
 *
 * The proxy this replaces verified the JWT itself and kept a `demoTokens` Map
 * in module scope that nothing ever wrote to - so its demo branch was
 * unreachable, and on serverless the map would not have survived a request
 * anyway.
 */
export const GET = withRoute({
  handler: async () => ({ apiKeys: await listApiKeysMasked() }),
});

const SaveApiKeysSchema = z
  .object({ apiKeys: z.record(z.string(), z.string()) })
  .strict();

export const POST = withRoute({
  body: SaveApiKeysSchema,
  handler: ({ body }) => saveApiKeys(body.apiKeys),
});
