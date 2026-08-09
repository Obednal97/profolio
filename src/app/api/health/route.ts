import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

/**
 * Liveness and readiness.
 *
 * Unauthenticated on purpose - it is what the container healthcheck and the
 * platform call, and it reports nothing beyond whether the database answers.
 * The Docker healthcheck points here; it used to probe `/api`, which only
 * responded in development because that is where Swagger was mounted.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 503 },
    );
  }
}
