import type { IncomingMessage, ServerResponse } from "http";

/**
 * Vercel Function entry point for the NestJS backend.
 *
 * Imports from ../dist rather than ../src on purpose: Vercel compiles files
 * under api/ with esbuild, which does not emit decorator metadata, and NestJS
 * dependency injection depends on it entirely. The build command runs
 * `nest build` (tsc, with emitDecoratorMetadata) first, so this file only ever
 * imports already-compiled JavaScript and stays free of decorators itself.
 *
 * The app is created once and reused. Fluid Compute keeps instances warm
 * across requests, so bootstrapping per request would waste the reuse and add
 * latency to every call.
 */
let appPromise: Promise<{ handler: (req: IncomingMessage, res: ServerResponse) => void }> | null =
  null;

async function getHandler() {
  if (!appPromise) {
    appPromise = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createApp } = await import("../dist/create-app.js");
      const app = await createApp();
      await app.init();
      const server = app.getHttpAdapter().getInstance();
      return { handler: server };
    })();
  }
  return appPromise;
}

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse
) {
  const { handler } = await getHandler();
  return handler(req, res);
}
