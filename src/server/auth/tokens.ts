import "server-only";
import jwt from "jsonwebtoken";

/**
 * Issuing side of the session. `session.ts` is the verifying side.
 *
 * There used to be two implementations that disagreed. AuthService signed
 * through Nest's JwtModule, which was configured with
 * `JWT_SECRET || "dev-jwt-secret-fallback"` - a publicly known string in the
 * repository, so any deployment missing the variable issued forgeable tokens.
 * AuthController signed directly and did enforce a secret, but produced a
 * different payload. One function now does it, and a weak or absent secret is
 * a hard failure rather than a silent downgrade.
 */

/** 24 hours. Must stay in step with AUTH_COOKIE_MAX_AGE. */
const TOKEN_TTL = "24h";

/** HS256 with a 256-bit key needs at least 32 characters of secret. */
const MIN_SECRET_LENGTH = 32;

export interface TokenSubject {
  id: string;
  email: string;
}

function requireSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }
  return secret;
}

/**
 * Signs a session token.
 *
 * `sub` carries the user id, which is what session.ts reads. Nothing else in
 * the payload is trusted on the way back in - the user record is loaded from
 * the database on every request - so no profile fields are embedded here.
 */
export function signAuthToken(user: TokenSubject): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      iss: "profolio",
    },
    requireSecret(),
    { expiresIn: TOKEN_TTL, algorithm: "HS256" },
  );
}
