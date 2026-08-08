import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxyToBackend";

// Mark this route as dynamic to prevent static generation
export const dynamic = "force-dynamic";

/**
 * Cached price lookup.
 *
 * This route used to authenticate callers itself, and did it wrongly: any
 * request carrying a `Bearer ` prefix - the token was never verified against
 * anything - was resolved to a hardcoded `{ id: "real-user-id" }`. It also
 * chose its backend URL from NEXT_PUBLIC_API_URL, a client-exposed variable,
 * with a NEXTAUTH_URL fallback that pointed at the frontend itself.
 *
 * Authentication now happens where the secret lives. proxyToBackend forwards
 * the httpOnly auth cookie (or an explicit Authorization header) and the
 * backend's JwtAuthGuard decides, exactly as it does for every other route.
 *
 * Note this duplicates /api/market-data/cached-price/[symbol]; the two should
 * be collapsed, but that is a behaviour change for callers rather than a
 * security fix, so it is left for the API consolidation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  return proxyToBackend(
    request,
    `/api/market-data/cached-price/${encodeURIComponent(symbol.toUpperCase())}`
  );
}
