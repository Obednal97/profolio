import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/server/http/errors";
import { handleWebhook } from "@/server/modules/billing/service";

/**
 * Stripe webhook receiver.
 *
 * Outside `withRoute` on purpose. Stripe signs the exact bytes it sent, so the
 * body has to be read as text and handed over untouched - any JSON parse or
 * re-serialise first, which is what withRoute does, invalidates the signature
 * and every event is rejected.
 *
 * There is no session here either: the caller is Stripe. The signature is the
 * authentication.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { success: false, error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  try {
    const result = await handleWebhook(signature, await request.text());
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status },
      );
    }

    // Anything else is ours, not Stripe's. A 500 makes Stripe retry, which is
    // what we want for a transient database failure.
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
