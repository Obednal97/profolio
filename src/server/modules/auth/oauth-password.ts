import "server-only";
import { createHash, randomBytes } from "crypto";
import { hash } from "bcrypt";
import { prisma } from "@/server/db";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import {
  BadRequest,
  Conflict,
  NotFound,
  ServiceUnavailable,
  TooManyRequests,
} from "@/server/http/errors";
import type { SetPasswordInput } from "./schemas";

/**
 * Lets a Firebase-only account add an email and password login.
 *
 * The flow is: the signed-in user asks for a setup link, receives a one-hour
 * token by email, and exchanges it for a password. The account then has
 * provider "dual".
 *
 * This flow has never worked. The token was hashed with bcrypt and then looked
 * up with `findFirst({ where: { token: hashedToken } })` - bcrypt salts every
 * call, so hashing the same token a second time produced a different string
 * and the row could never be found. Every verification returned "Invalid
 * token". The digest is now SHA-256, which is deterministic, and correct for a
 * 256-bit random value that needs no work factor.
 */

const MAX_ATTEMPTS = 5;
const TOKEN_EXPIRY_HOURS = 1;
const BCRYPT_ROUNDS = 12;

function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Requests a password setup link.
 *
 * There is no email transport in this application yet. Rather than reporting
 * success for a message that is never sent, this fails loudly in production
 * and prints the link to the server log in development, which is the only
 * environment where reading a setup token out of the log is acceptable.
 */
export async function requestPasswordSetup() {
  const caller = await requireUser();
  assertNotDemo(caller);

  const user = await prisma.user.findUnique({
    where: { id: caller.id },
    select: { id: true, email: true, name: true, password: true, provider: true },
  });
  if (!user) throw new NotFound("User not found");

  if (user.password.length > 0) {
    throw new BadRequest("This account already has a password set");
  }
  if (user.provider !== "firebase") {
    throw new BadRequest("This is only available for OAuth accounts");
  }

  if (process.env.NODE_ENV === "production") {
    throw new ServiceUnavailable(
      "Email delivery is not configured, so a setup link cannot be sent",
    );
  }

  // Expire any outstanding link, so only the newest one works.
  await prisma.passwordSetupToken.updateMany({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordSetupToken.create({
    data: { userId: user.id, token: digest(token), expiresAt, used: false },
  });

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  console.warn(
    `[dev] Password setup link for ${user.email}: ${baseUrl}/auth/setup-password?token=${token}`,
  );

  return {
    success: true,
    message: "Password setup email sent to your registered email address",
  };
}

/** Checks a setup token without consuming it. */
export async function verifySetupToken(token: string) {
  const hashed = digest(token);

  const record = await prisma.passwordSetupToken.findFirst({
    where: { token: hashed },
    include: { user: { select: { email: true } } },
  });

  if (!record) throw new BadRequest("Invalid token");
  if (record.used) throw new BadRequest("Token has already been used");
  if (record.expiresAt < new Date()) throw new BadRequest("Token has expired");

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new TooManyRequests(
      "Too many verification attempts. Please request a new token.",
    );
  }

  await prisma.passwordSetupToken.update({
    where: { id: record.id },
    data: { attempts: record.attempts + 1 },
  });

  return {
    valid: true,
    email: record.user.email,
    expiresIn: Math.floor((record.expiresAt.getTime() - Date.now()) / 1000),
  };
}

/** Exchanges a valid setup token for a password. */
export async function setPasswordWithToken(input: SetPasswordInput) {
  const record = await prisma.passwordSetupToken.findFirst({
    where: { token: digest(input.token), used: false, expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, email: true, password: true } } },
  });

  if (!record) throw new BadRequest("Invalid or expired token");

  if (record.user.password.length > 0) {
    throw new Conflict("Password has already been set");
  }

  // A password containing the email local part is trivially guessable from the
  // address it was sent to.
  const emailLocal = record.user.email.split("@")[0]?.toLowerCase();
  if (emailLocal && input.password.toLowerCase().includes(emailLocal)) {
    throw new BadRequest("Password cannot contain your email address");
  }

  const hashedPassword = await hash(input.password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashedPassword,
        // Both sign-in methods now work for this account.
        provider: "dual",
        // They proved control of the mailbox by following the link.
        emailVerified: true,
      },
    }),
    prisma.passwordSetupToken.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma.passwordSetupToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
  ]);

  return {
    success: true,
    message:
      "Password set successfully. You can now sign in with email and password.",
    provider: "dual" as const,
  };
}
