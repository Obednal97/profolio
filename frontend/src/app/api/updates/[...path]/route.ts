import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxyToBackend";

/**
 * Catch-all for the updates API: /status, /start, /cancel, /progress.
 *
 * No proxy existed for these at all, so useUpdates called the backend directly
 * on http://localhost:3001 - unreachable from a browser in any real
 * deployment. /progress is Server-Sent Events, which proxyToBackend streams
 * through rather than buffering.
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(request, `/api/updates/${path.join("/")}`);
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
