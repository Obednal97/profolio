import { NextResponse, type NextRequest } from "next/server";
import { syncAllPrices } from "@/server/modules/market-data/price-sync";

/**
 * Scheduled price synchronisation, called by Vercel Cron (see vercel.json).
 *
 * Deliberately outside `withRoute` and outside the session layer: the caller
 * is the platform, not a user. CRON_SECRET is the credential, and if it is
 * unset the endpoint refuses rather than defaulting to open.
 *
 * The NestJS equivalent used an @Cron decorator on a long-lived service, which
 * cannot fire on serverless because nothing is running between requests.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET is not set; refusing to run the price sync");
    return NextResponse.json(
      { success: false, error: "Cron is not configured" },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const result = await syncAllPrices();

  console.log(
    `Price sync: ${result.updated} symbols updated, ${result.failed} failed, ` +
      `${result.assetsRepriced} holdings repriced`,
  );

  return NextResponse.json({
    success: true,
    ranAt: new Date().toISOString(),
    ...result,
  });
}
