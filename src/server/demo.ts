import "server-only";
import type { NextRequest } from "next/server";

/**
 * Demo mode.
 *
 * A demo session has no account and no rows: the routes answer from a fixed
 * sample portfolio in `lib/demoData`. The signal is the `demo-mode` cookie,
 * not localStorage, because server code cannot see localStorage - that
 * mismatch is why the flag used to be invisible to every route checking for
 * it.
 *
 * The check runs before `requireUser()`, since a demo visitor has no session
 * to resolve. The sample data is labelled as such in the UI and is never mixed
 * with a real account's figures.
 */

/**
 * Whether demo mode may be used at all in this environment.
 *
 * The flag the deployment actually sets is `NEXT_PUBLIC_ENABLE_DEMO_MODE` -
 * the server-side check looked only at `ENABLE_DEMO_MODE`, which nothing sets,
 * so demo mode was silently off in production however it was configured.
 */
export function demoModeAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  return (
    process.env.ENABLE_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true"
  );
}

/** Whether this request is a demo session. */
export function isDemoRequest(request: NextRequest): boolean {
  if (!demoModeAllowed()) return false;

  return request.cookies.get("demo-mode")?.value === "true";
}
