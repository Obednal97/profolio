import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxyToBackend";

/**
 * Catch-all proxy for the admin API (/admin/users, /admin/rate-limit/*).
 *
 * No admin proxy route existed, which is part of why the admin page was a
 * placeholder. Authorisation is enforced by the backend's RoleGuard, which
 * requires ADMIN or SUPER_ADMIN - this layer only forwards credentials and
 * must not make its own access decisions.
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToBackend(request, `/api/admin/${path.join("/")}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
