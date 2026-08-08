import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxyToBackend";

/**
 * Catch-all for notification sub-paths: /{id}, /{id}/read, /mark-all-read,
 * /read. These had no proxy route, so useNotifications addressed the backend
 * directly on http://localhost:3001 and broke behind any reverse proxy.
 *
 * `unread-count` has its own route file, which takes precedence over this.
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(request, `/api/notifications/${path.join("/")}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
