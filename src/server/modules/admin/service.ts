import "server-only";
import { z } from "zod";
import { hash } from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { Conflict, Forbidden, NotFound } from "@/server/http/errors";

/**
 * Administration.
 *
 * Every function starts with requireAdmin(). The NestJS controller relied on
 * a RoleGuard, which is easy to forget to attach - and was, on two market-data
 * endpoints documented as admin-only.
 */

/**
 * The columns an admin screen may see.
 *
 * findAll and findOne used to return whole User rows, which include the bcrypt
 * password hash, the Stripe customer and subscription ids and every other
 * column, straight to the browser.
 */
const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerified: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
  lastSignIn: true,
  subscriptionStatus: true,
  subscriptionTier: true,
} as const;

export const AdminUserIdSchema = z.object({ id: z.uuid() }).strict();

/**
 * Admin-created accounts.
 *
 * The old DTO had no validators at all, so an admin could create an account
 * with an invalid email and a one-character password, and the service wrote
 * that password to the database in plain text.
 */
export const CreateUserSchema = z
  .object({
    email: z.email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain an uppercase letter, a lowercase letter and a number",
      ),
    name: z.string().trim().max(100).optional(),
    role: z.enum(UserRole).optional(),
  })
  .strict();
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export async function listUsers() {
  await requireAdmin();

  return prisma.user.findMany({
    select: ADMIN_USER_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getUser(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: ADMIN_USER_SELECT,
  });
  if (!user) throw new NotFound("User not found");

  return user;
}

export async function createUser(input: CreateUserInput) {
  const admin = await requireAdmin();

  // Only a SUPER_ADMIN may mint another administrator; otherwise an ADMIN
  // could promote at will and the distinction between the two would mean
  // nothing.
  if (
    input.role &&
    input.role !== "USER" &&
    admin.role !== "SUPER_ADMIN"
  ) {
    throw new Forbidden("Only a super administrator may create admin accounts");
  }

  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) throw new Conflict("An account with this email already exists");

  return prisma.user.create({
    data: {
      email,
      name: input.name ?? null,
      role: input.role ?? "USER",
      provider: "local",
      // Cost 12, matching self-registration, so accounts are indistinguishable
      // at rest.
      password: await hash(input.password, 12),
    },
    select: ADMIN_USER_SELECT,
  });
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();

  if (id === admin.id) {
    throw new Forbidden("You cannot delete your own account from here");
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target) throw new NotFound("User not found");

  if (target.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
    throw new Forbidden("Only a super administrator may delete one");
  }

  // Same explicit ordering as self-deletion: most relations to User were
  // declared without onDelete: Cascade, so the database would refuse.
  await prisma.$transaction([
    prisma.priceHistory.deleteMany({ where: { asset: { userId: id } } }),
    prisma.assetTransaction.deleteMany({ where: { asset: { userId: id } } }),
    prisma.asset.deleteMany({ where: { userId: id } }),
    prisma.liability.deleteMany({ where: { userId: id } }),
    prisma.expense.deleteMany({ where: { userId: id } }),
    prisma.property.deleteMany({ where: { userId: id } }),
    prisma.settings.deleteMany({ where: { userId: id } }),
    prisma.twoFactorVerification.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return { success: true as const };
}
