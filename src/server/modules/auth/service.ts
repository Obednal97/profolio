import "server-only";
import { compare, hash } from "bcrypt";
import { prisma } from "@/server/db";
import { signAuthToken } from "@/server/auth/tokens";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { BadRequest, Conflict, Unauthorized } from "@/server/http/errors";
import type {
  ChangePasswordInput,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
} from "./schemas";
import { isTwoFactorEnabled, issueVerificationToken } from "./two-factor";

/**
 * Account lifecycle: registration, sign-in, profile, password, deletion.
 *
 * Ported from AuthService and AuthController, which between them held the
 * logic, the HTTP mapping and a second JWT implementation. Authorisation is
 * done here rather than by a guard: every function that touches an existing
 * account calls requireUser() itself, because a forgotten call is an open
 * endpoint with no compiler error.
 */

const BCRYPT_ROUNDS = 12;

/**
 * A real hash to compare against when the email does not exist, so a missing
 * account and a wrong password take the same time. Without it the response
 * time distinguishes registered emails from unregistered ones.
 */
const DUMMY_HASH =
  "$2b$12$SfzPzqdiyTUBm8pJoL9Xv.jWK4JPW9QuWaHOZfVCpvwxv9eyZeici";

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  country: true,
  bio: true,
  photoURL: true,
  location: true,
  preferredCurrency: true,
  theme: true,
  timezone: true,
  language: true,
  taxCountry: true,
  taxRate: true,
  provider: true,
  emailVerified: true,
  lastSignIn: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface AuthenticatedResult {
  success: true;
  token: string;
  user: { id: string; email: string; name: string | null };
}

export interface TwoFactorRequiredResult {
  requiresTwoFactor: true;
  verificationToken: string;
}

export async function signUp(input: SignUpInput): Promise<AuthenticatedResult> {
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new Conflict("An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: await hash(input.password, BCRYPT_ROUNDS),
      name: input.name ?? null,
      provider: "local",
      emailVerified: false,
      lastSignIn: new Date(),
    },
    select: { id: true, email: true, name: true },
  });

  return { success: true, token: signAuthToken(user), user };
}

/**
 * Sign in.
 *
 * When 2FA is enabled no session token is issued - the caller gets a
 * short-lived verification token and must complete the second factor. The
 * previous implementation minted a full JWT first and then discarded it, which
 * worked only because the value never left the process.
 */
export async function signIn(
  input: SignInInput,
): Promise<AuthenticatedResult | TwoFactorRequiredResult> {
  const email = input.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, password: true },
  });

  const passwordMatches = await compare(
    input.password,
    user?.password || DUMMY_HASH,
  );

  // An account with no password is a Firebase-only account: it must not be
  // possible to sign into one with an empty string.
  if (!user || !user.password || !passwordMatches) {
    throw new Unauthorized("Invalid email or password");
  }

  if (await isTwoFactorEnabled(user.id)) {
    return {
      requiresTwoFactor: true,
      verificationToken: await issueVerificationToken(user.id),
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSignIn: new Date() },
  });

  return {
    success: true,
    token: signAuthToken(user),
    user: { id: user.id, email: user.email, name: user.name },
  };
}

/** Full profile for the signed-in caller. */
export async function getProfile() {
  const caller = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: caller.id },
    select: PROFILE_SELECT,
  });
  if (!user) throw new Unauthorized();

  return { success: true, user };
}

export async function updateProfile(input: UpdateProfileInput) {
  const caller = await requireUser();
  assertNotDemo(caller);

  const email = input.email?.toLowerCase();

  if (email && email !== caller.email.toLowerCase()) {
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: caller.id } },
      select: { id: true },
    });
    if (taken) throw new Conflict("Email already exists");
  }

  const user = await prisma.user.update({
    where: { id: caller.id },
    data: { ...input, email },
    select: PROFILE_SELECT,
  });

  return { success: true, user };
}

/**
 * Change an existing password, or set the first one.
 *
 * Firebase accounts have an empty password column, and for those the current
 * password is not required - there is none to prove. Everyone else must supply
 * it.
 */
export async function changePassword(input: ChangePasswordInput) {
  const caller = await requireUser();
  assertNotDemo(caller);

  const user = await prisma.user.findUnique({
    where: { id: caller.id },
    select: { id: true, password: true },
  });
  if (!user) throw new Unauthorized();

  const hasPassword = user.password.trim() !== "";

  if (hasPassword) {
    if (!input.currentPassword) {
      throw new BadRequest("Current password is required");
    }
    if (!(await compare(input.currentPassword, user.password))) {
      throw new BadRequest("Current password is incorrect");
    }
  }

  await prisma.user.update({
    where: { id: caller.id },
    data: { password: await hash(input.newPassword, BCRYPT_ROUNDS) },
  });

  return {
    success: true,
    message: hasPassword
      ? "Password changed successfully"
      : "Password set successfully",
  };
}

/**
 * Delete the caller's account and everything belonging to it.
 *
 * The settings page has always had a delete button pointing at this endpoint;
 * the endpoint did not exist, so it returned the Next 404 page.
 *
 * The deletes are explicit because most relations to User were declared
 * without `onDelete: Cascade` - only ApiKey, Notification, RoleChange,
 * TwoFactorAuth and PasswordSetupToken cascade, so relying on the database
 * would fail on the first foreign key instead. TwoFactorVerification has no
 * foreign key at all and would otherwise be orphaned. PriceHistory and
 * AssetTransaction cascade from Asset, so removing assets removes those.
 */
export async function deleteAccount() {
  const caller = await requireUser();
  assertNotDemo(caller);

  const userId = caller.id;

  await prisma.$transaction([
    prisma.priceHistory.deleteMany({ where: { asset: { userId } } }),
    prisma.assetTransaction.deleteMany({ where: { asset: { userId } } }),
    prisma.asset.deleteMany({ where: { userId } }),
    prisma.liability.deleteMany({ where: { userId } }),
    prisma.expense.deleteMany({ where: { userId } }),
    prisma.property.deleteMany({ where: { userId } }),
    prisma.settings.deleteMany({ where: { userId } }),
    prisma.twoFactorVerification.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return { success: true, message: "Account deleted" };
}
