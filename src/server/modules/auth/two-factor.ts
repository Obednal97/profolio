import "server-only";
import { createHash, randomBytes } from "crypto";
import { compare, hash } from "bcrypt";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "@/server/db";
import { encryption } from "@/server/crypto/encryption";
import { signAuthToken } from "@/server/auth/tokens";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import {
  BadRequest,
  NotFound,
  Unauthorized,
} from "@/server/http/errors";
import type { AuthenticatedResult } from "./service";

/**
 * TOTP two-factor authentication.
 *
 * The stored secret is encrypted with the envelope in
 * `server/crypto/encryption.ts`; do not change that format, existing rows
 * become unreadable. Backup codes are bcrypt hashes and are shown once.
 */

authenticator.options = {
  /** One step either side, so a slightly wrong clock still verifies. */
  window: 1,
  step: 30,
};

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_ROUNDS = 10;
const VERIFICATION_TOKEN_TTL_MS = 5 * 60 * 1000;

/**
 * Bearer tokens are stored as SHA-256 digests rather than in the clear.
 * SHA-256 rather than bcrypt because the lookup is by equality: bcrypt salts
 * every call, so hashing the same token twice gives different strings and the
 * row can never be found again. These tokens are 256 bits of CSPRNG output, so
 * there is nothing for a slow hash to protect against.
 */
function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateBackupCodes(count: number): string[] {
  return Array.from({ length: count }, () => {
    const code = randomBytes(4).toString("hex").toUpperCase();
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  });
}

async function hashBackupCodes(codes: string[]) {
  return Promise.all(
    codes.map(async (code) => ({ code: await hash(code, BACKUP_CODE_ROUNDS) })),
  );
}

/** Confirms the caller knows their own password before a 2FA change. */
async function verifyCallerPassword(
  userId: string,
  password: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user?.password) {
    throw new BadRequest(
      "This account has no password set, so it cannot be verified this way",
    );
  }

  if (!(await compare(password, user.password))) {
    throw new Unauthorized("Invalid password");
  }
}

/** Whether 2FA is active on an account. Used by the sign-in path. */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const record = await prisma.twoFactorAuth.findFirst({
    where: { userId, enabled: true },
    select: { id: true },
  });
  return record !== null;
}

/** Issues the short-lived token that stands in for a session mid-sign-in. */
export async function issueVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");

  await prisma.twoFactorVerification.create({
    data: {
      userId,
      token: digest(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  return token;
}

/**
 * Consumes a verification token and returns the user it belongs to.
 *
 * Single use: the row is deleted whether or not the code that follows turns
 * out to be correct. That costs a failed attempt a fresh sign-in, and is the
 * only thing standing between this endpoint and unlimited guesses at a
 * six-digit code.
 */
async function consumeVerificationToken(token: string): Promise<string> {
  const verification = await prisma.twoFactorVerification.findFirst({
    where: { token: digest(token), expiresAt: { gt: new Date() } },
  });

  if (!verification) {
    throw new Unauthorized("Invalid or expired verification token");
  }

  await prisma.twoFactorVerification.delete({ where: { id: verification.id } });

  return verification.userId;
}

/** Verifies a TOTP code against an enabled account. */
async function verifyTotp(userId: string, code: string): Promise<boolean> {
  const record = await prisma.twoFactorAuth.findFirst({
    where: { userId, enabled: true },
    select: { secret: true },
  });
  if (!record) return false;

  return authenticator.verify({
    token: code,
    secret: encryption.decrypt(record.secret),
  });
}

/**
 * Starts setup: generates a secret, stores it disabled, and returns the QR
 * code and backup codes. Nothing is active until the code is verified.
 */
export async function startTwoFactorSetup(password: string) {
  const caller = await requireUser();
  assertNotDemo(caller);

  await verifyCallerPassword(caller.id, password);

  const existing = await prisma.twoFactorAuth.findUnique({
    where: { userId: caller.id },
    select: { enabled: true },
  });
  if (existing?.enabled) {
    throw new BadRequest("2FA is already enabled for this account");
  }

  const secret = authenticator.generateSecret();
  const qrCode = await QRCode.toDataURL(
    authenticator.keyuri(caller.email, "Profolio", secret),
  );
  const backupCodes = generateBackupCodes(BACKUP_CODE_COUNT);
  const hashedCodes = await hashBackupCodes(backupCodes);
  const encryptedSecret = encryption.encrypt(secret);

  await prisma.twoFactorAuth.upsert({
    where: { userId: caller.id },
    create: {
      userId: caller.id,
      secret: encryptedSecret,
      enabled: false,
      backupCodes: { create: hashedCodes },
    },
    update: {
      secret: encryptedSecret,
      enabled: false,
      backupCodes: { deleteMany: {}, create: hashedCodes },
    },
  });

  // The plaintext secret is returned once, for manual entry where a camera is
  // not available. It is never readable again.
  return { secret, qrCode, backupCodes };
}

/** Confirms setup by checking a code, and switches 2FA on. */
export async function enableTwoFactor(code: string) {
  const caller = await requireUser();

  const record = await prisma.twoFactorAuth.findUnique({
    where: { userId: caller.id },
  });
  if (!record) {
    throw new NotFound("2FA setup not found. Please start setup again.");
  }
  if (record.enabled) {
    throw new BadRequest("2FA is already enabled");
  }

  const valid = authenticator.verify({
    token: code,
    secret: encryption.decrypt(record.secret),
  });
  if (!valid) {
    throw new BadRequest("Invalid verification code");
  }

  await prisma.twoFactorAuth.update({
    where: { id: record.id },
    data: { enabled: true, verifiedAt: new Date() },
  });

  return { success: true };
}

/** Second step of sign-in: TOTP code plus verification token. */
export async function completeTwoFactorSignIn(input: {
  verificationToken: string;
  code: string;
}): Promise<AuthenticatedResult> {
  const userId = await consumeVerificationToken(input.verificationToken);

  if (!(await verifyTotp(userId, input.code))) {
    throw new Unauthorized("Invalid 2FA code");
  }

  return finishSignIn(userId);
}

/** Second step of sign-in using a one-time backup code. */
export async function completeWithBackupCode(input: {
  verificationToken: string;
  code: string;
}): Promise<AuthenticatedResult & { warning: string }> {
  const userId = await consumeVerificationToken(input.verificationToken);

  const record = await prisma.twoFactorAuth.findFirst({
    where: { userId, enabled: true },
    include: { backupCodes: { where: { usedAt: null } } },
  });
  if (!record) {
    throw new Unauthorized("Invalid backup code");
  }

  let matched: string | null = null;
  for (const backupCode of record.backupCodes) {
    if (await compare(input.code, backupCode.code)) {
      matched = backupCode.id;
      break;
    }
  }

  if (!matched) {
    throw new Unauthorized("Invalid backup code");
  }

  await prisma.twoFactorBackupCode.update({
    where: { id: matched },
    data: { usedAt: new Date() },
  });

  return {
    ...(await finishSignIn(userId)),
    warning: "Backup code used. Please generate new backup codes.",
  };
}

/** Shared tail of both second-factor paths. */
async function finishSignIn(userId: string): Promise<AuthenticatedResult> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { lastSignIn: new Date() },
    select: { id: true, email: true, name: true },
  });

  return { success: true, token: signAuthToken(user), user };
}

/** Turns 2FA off. Requires both the password and a current code. */
export async function disableTwoFactor(input: {
  password: string;
  code: string;
}) {
  const caller = await requireUser();
  assertNotDemo(caller);

  await verifyCallerPassword(caller.id, input.password);

  if (!(await verifyTotp(caller.id, input.code))) {
    throw new Unauthorized("Invalid 2FA code");
  }

  await prisma.twoFactorAuth.delete({ where: { userId: caller.id } });

  return { success: true };
}

export async function getTwoFactorStatus() {
  const caller = await requireUser();

  const record = await prisma.twoFactorAuth.findUnique({
    where: { userId: caller.id },
    include: { backupCodes: { where: { usedAt: null } } },
  });

  if (!record) {
    return { enabled: false, verifiedAt: null, backupCodesRemaining: 0 };
  }

  return {
    enabled: record.enabled,
    verifiedAt: record.verifiedAt,
    backupCodesRemaining: record.backupCodes.length,
  };
}

/** Replaces every backup code. Requires the password and a current code. */
export async function regenerateBackupCodes(input: {
  password: string;
  code: string;
}) {
  const caller = await requireUser();
  assertNotDemo(caller);

  await verifyCallerPassword(caller.id, input.password);

  if (!(await verifyTotp(caller.id, input.code))) {
    throw new Unauthorized("Invalid 2FA code");
  }

  const record = await prisma.twoFactorAuth.findFirst({
    where: { userId: caller.id, enabled: true },
    select: { id: true },
  });
  if (!record) {
    throw new BadRequest("2FA is not enabled for this account");
  }

  const backupCodes = generateBackupCodes(BACKUP_CODE_COUNT);
  const hashedCodes = await hashBackupCodes(backupCodes);

  await prisma.$transaction([
    prisma.twoFactorBackupCode.deleteMany({
      where: { twoFactorId: record.id },
    }),
    prisma.twoFactorBackupCode.createMany({
      data: hashedCodes.map((entry) => ({
        twoFactorId: record.id,
        code: entry.code,
      })),
    }),
  ]);

  return { success: true, backupCodes };
}
