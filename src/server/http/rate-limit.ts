import "server-only";
import { createHash } from "crypto";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { TooManyRequests } from "./errors";

/**
 * Rate limiting for the endpoints an attacker can reach without credentials.
 *
 * The implementation this replaces matched its rules against paths like
 * "/auth/signin" while the runtime path carried an "/api" prefix, so no rule
 * ever matched and every request was allowed. Nothing here reads the URL: a
 * route names the rule it wants, which is a mistake the compiler can catch.
 *
 * No Upstash instance is provisioned for this project today - the old one went
 * with the deployment it was attached to. Without the environment variables
 * the limiter is inert: it allows every request, warns once, and never throws,
 * so the application behaves exactly as it does now. Attaching Redis and
 * setting the variables is the whole of turning enforcement on.
 */

/** Keys are namespaced so a shared Redis instance cannot collide with ours. */
const KEY_PREFIX = "profolio:rl";

export interface RateLimitRule {
  /**
   * Bucket name. Two rules sharing a name share a counter, which is how the
   * two 2FA endpoints pool their attempts.
   */
  readonly name: string;
  /** Requests allowed per window. */
  readonly limit: number;
  /** Window length, as understood by @upstash/ratelimit. */
  readonly window: Duration;
}

/**
 * Every rule is keyed on the caller's IP and nothing else.
 *
 * Keying sign-in on the submitted email was the obvious alternative and is
 * worse twice over: an attacker could exhaust a victim's bucket and lock them
 * out of their own account, and the cache would then hold email addresses it
 * has no reason to keep. Anything the caller chooses freely would have to be
 * combined with the IP rather than used on its own.
 *
 * Counters are also not keyed on the 2FA verification token. An attacker who
 * has the password can mint a fresh token whenever they like, so a per-token
 * counter resets itself on demand and a per-IP one does not.
 */
export const RATE_LIMITS = {
  /**
   * Ten in five minutes. A person mistyping a password needs three or four
   * attempts, and this leaves room for an office or household behind one
   * address, while capping an online guessing run at 120 an hour.
   */
  signIn: { name: "auth:signin", limit: 10, window: "5 m" },

  /**
   * Ten an hour. Registering happens once per person, so the only thing that
   * needs this volume is bulk account creation.
   */
  signUp: { name: "auth:signup", limit: 10, window: "1 h" },

  /**
   * Five in five minutes, shared by the code and backup-code endpoints so
   * alternating between them does not double the allowance.
   *
   * A six digit code is one million combinations. One attempt a minute needs
   * roughly a year to reach an even chance of hitting one, which turns a
   * feasible brute force into an infeasible one; somebody reading a code off
   * their phone needs two or three tries. The backup path also compares
   * bcrypt hashes for up to ten stored codes, about a second of CPU per
   * request, so the same ceiling keeps that from being a cheap way to load
   * the server.
   */
  twoFactor: { name: "auth:2fa", limit: 5, window: "5 m" },

  /**
   * Twenty in ten minutes. The setup token is 256 bits of CSPRNG output, so
   * guessing it is not the risk; the limit stops the endpoint being polled as
   * an oracle for which tokens are live, while tolerating a page that checks
   * on load and a user who refreshes it.
   */
  verifySetupToken: { name: "auth:verify-setup-token", limit: 20, window: "10 m" },

  /**
   * Ten an hour. This writes a credential to an account that has none yet and
   * a legitimate user does it once. Rejected passwords never reach here: the
   * schema runs first, and only requests that get as far as the handler count.
   */
  setPassword: { name: "auth:set-password", limit: 10, window: "1 h" },

  /**
   * Thirty in five minutes. Every Firebase sign-in and token refresh comes
   * through here, so a tight limit would break normal use; the number is set
   * to protect the Admin SDK verification round trip behind it.
   */
  firebaseExchange: { name: "auth:firebase-exchange", limit: 30, window: "5 m" },
} as const satisfies Record<string, RateLimitRule>;

interface EnabledState {
  readonly kind: "enabled";
  readonly redis: Redis;
  readonly limiters: Map<string, Ratelimit>;
}

interface DisabledState {
  readonly kind: "disabled";
}

/**
 * Resolved once per process. Memoising is also what makes the warning fire at
 * most once rather than on every unauthenticated request.
 */
let state: EnabledState | DisabledState | undefined;

/**
 * Both variable names @upstash/redis reads from are accepted here. Checking
 * only the UPSTASH_ pair would report the limiter as unconfigured on a Vercel
 * KV install where the client would in fact have connected.
 */
function isConfigured(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}

function resolveState(): EnabledState | DisabledState {
  if (state) return state;

  if (!isConfigured()) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are " +
        "not set, so the authentication endpoints are NOT rate limited. " +
        "Attach a Redis instance and set both to enable enforcement.",
    );
    state = { kind: "disabled" };
    return state;
  }

  try {
    state = { kind: "enabled", redis: Redis.fromEnv(), limiters: new Map() };
  } catch (error) {
    // Construction only throws on missing configuration, which was just
    // checked, but a limiter that cannot be built must never be the reason a
    // sign-in fails.
    console.warn("[rate-limit] Could not initialise Upstash Redis:", error);
    state = { kind: "disabled" };
  }

  return state;
}

function limiterFor(rule: RateLimitRule): Ratelimit | undefined {
  const resolved = resolveState();
  if (resolved.kind === "disabled") return undefined;

  const existing = resolved.limiters.get(rule.name);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: resolved.redis,
    limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
    prefix: `${KEY_PREFIX}:${rule.name}`,
    /**
     * Once an identifier is over its limit this answers from process memory
     * for the rest of the window, so a flood costs one Redis round trip
     * rather than one per request.
     */
    ephemeralCache: new Map<string, number>(),
  });

  resolved.limiters.set(rule.name, limiter);
  return limiter;
}

/**
 * The caller's address.
 *
 * Vercel appends each proxy hop to the right of x-forwarded-for, so the
 * left-most entry is the client; taking the last would key every request on
 * Vercel's own proxy and make the whole application share one bucket. The
 * header is caller-supplied and therefore spoofable in general, but on Vercel
 * it is rewritten at the edge.
 *
 * Direct requests carry neither header - local development, or a self-hosted
 * install reached without a reverse proxy. Those all fall into one bucket,
 * which is only ever an issue where Redis is configured but no proxy sets the
 * headers.
 */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const client = forwarded.split(",")[0]?.trim();
    if (client) return client;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * An IP address is personal data, so what reaches Redis is a digest of it and
 * not the address itself. Half of a SHA-256 is far more than enough to keep
 * two callers apart.
 */
function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

/**
 * Counts this request against `rule` and throws TooManyRequests when the
 * caller is over it. withRoute() turns that into a 429 with a Retry-After
 * header, so a handler only has to await this before it does any real work.
 *
 * Returns silently when no Redis is configured.
 */
export async function limit(
  request: NextRequest,
  rule: RateLimitRule,
): Promise<void> {
  const limiter = limiterFor(rule);
  if (!limiter) return;

  try {
    const result = await limiter.limit(fingerprint(clientIp(request)));
    if (result.success) return;

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    );

    throw new TooManyRequests(
      "Too many attempts. Please wait before trying again.",
      retryAfterSeconds,
    );
  } catch (error) {
    if (error instanceof TooManyRequests) throw error;

    // Fail OPEN. Locking users out of their own accounts because a cache is
    // unreachable is worse than the abuse the limit prevents: Redis being
    // down would otherwise take sign-in down with it, and an outage is not
    // evidence of an attack.
    console.error("[rate-limit] Check failed, allowing the request:", error);
  }
}
