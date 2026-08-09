import "server-only";
import { z } from "zod";

/**
 * Request schemas for the auth module, replacing the class-validator DTOs.
 *
 * Every object is `.strict()`. The old global ValidationPipe ran with
 * `forbidNonWhitelisted: true`, so an unknown property was a 400; zod strips
 * silently by default, which would have turned those 400s into 200s with
 * fields quietly dropped. That matters here more than anywhere else - the
 * profile update previously spread the whole DTO into a Prisma `update`.
 */

/** At least one lower case letter, one upper case letter and one digit. */
const BASIC_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/** The stricter rule used for OAuth password setup: also needs a symbol. */
const STRONG_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

const COMPLEXITY_MESSAGE =
  "Password must contain at least one uppercase letter, one lowercase letter and one number";

export const SignUpSchema = z
  .object({
    email: z.email("Please provide a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(BASIC_COMPLEXITY, COMPLEXITY_MESSAGE),
    name: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z
  .object({
    email: z.email("Please provide a valid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();
export type SignInInput = z.infer<typeof SignInSchema>;

/**
 * Profile fields a user may change about themselves.
 *
 * `emailVerified` and `provider` were on the old DTO and reached Prisma
 * unfiltered, so a user could PATCH their own account to verified, or claim to
 * be a Firebase account. Both are decided by the server and are not accepted
 * here.
 */
export const UpdateProfileSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    email: z.email("Please provide a valid email address").optional(),
    phone: z.string().trim().max(50).optional(),
    country: z.string().trim().max(100).optional(),
    bio: z.string().trim().max(1000).optional(),
    photoURL: z.string().trim().max(2000).optional(),
    location: z.string().trim().max(200).optional(),
    preferredCurrency: z.string().trim().length(3).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    timezone: z.string().trim().max(100).optional(),
    language: z.string().trim().max(10).optional(),
    taxCountry: z.string().trim().max(100).optional(),
    /** Basis points, so 20% is 2000. */
    taxRate: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(BASIC_COMPLEXITY, COMPLEXITY_MESSAGE),
  })
  .strict();
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ============ Two-factor authentication ============

const TotpCode = z
  .string()
  .regex(/^\d{6}$/, "Code must be 6 digits");

const BackupCode = z
  .string()
  .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid backup code format");

export const SetupTwoFactorSchema = z
  .object({ password: z.string().min(1) })
  .strict();

export const VerifyTwoFactorSchema = z.object({ code: TotpCode }).strict();

export const CompleteTwoFactorSchema = z
  .object({ verificationToken: z.string().min(1), code: TotpCode })
  .strict();

export const VerifyBackupCodeSchema = z
  .object({ verificationToken: z.string().min(1), code: BackupCode })
  .strict();

export const DisableTwoFactorSchema = z
  .object({ password: z.string().min(1), code: TotpCode })
  .strict();

export const RegenerateBackupCodesSchema = z
  .object({ password: z.string().min(1), code: TotpCode })
  .strict();

// ============ OAuth password setup ============

export const VerifySetupTokenSchema = z
  .object({ token: z.string().min(1) })
  .strict();

export const SetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(
        STRONG_COMPLEXITY,
        "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      ),
    confirmPassword: z.string().min(1),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;

// ============ Firebase ============

/**
 * A Firebase ID token is a JWT: three base64url segments. The shape is checked
 * before the token reaches the Admin SDK so obviously malformed input is a 400
 * rather than a verification round trip.
 */
export const FirebaseExchangeSchema = z
  .object({
    firebaseToken: z
      .string()
      .min(100)
      .max(5000)
      .regex(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/, {
        message: "Invalid Firebase token",
      }),
  })
  .strict();
