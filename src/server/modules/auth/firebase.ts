import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { prisma } from "@/server/db";
import { signAuthToken } from "@/server/auth/tokens";
import { ServiceUnavailable, Unauthorized } from "@/server/http/errors";
import type { AuthenticatedResult } from "./service";

/**
 * Firebase sign-in, exchanged for a first-party session token.
 *
 * Firebase remains wired up but optional: with the three environment variables
 * unset the endpoint reports 503 and local email/password sign-in is
 * unaffected. Verification uses the Admin SDK - decoding the token without
 * checking its signature would accept anything.
 *
 * Initialisation is lazy and cached on globalThis. The NestJS version
 * initialised in a constructor, which on serverless runs on every cold start
 * and throws "app already exists" as soon as a warm instance handles a second
 * request.
 */

const globalForFirebase = globalThis as unknown as { firebaseApp?: App };

function getFirebaseApp(): App | null {
  if (globalForFirebase.firebaseApp) return globalForFirebase.firebaseApp;

  const existing = getApps();
  if (existing.length > 0) {
    globalForFirebase.firebaseApp = existing[0];
    return existing[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  // The key is accepted either raw or base64 encoded, and escaped newlines are
  // restored - environment variable UIs mangle multi-line values differently.
  const decoded = privateKey.includes("-----BEGIN PRIVATE KEY-----")
    ? privateKey
    : Buffer.from(privateKey, "base64").toString();

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: decoded.replace(/\\n/g, "\n"),
    }),
    projectId,
  });

  globalForFirebase.firebaseApp = app;
  return app;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseApp() !== null;
}

interface FirebaseUserInfo {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

async function verifyIdToken(idToken: string): Promise<FirebaseUserInfo> {
  const app = getFirebaseApp();
  if (!app) {
    throw new ServiceUnavailable(
      "Firebase sign-in is not configured on this deployment",
    );
  }

  let decoded: DecodedIdToken;
  try {
    // checkRevoked: a token from a session the user has since signed out of,
    // or an account that has been disabled, must not be accepted.
    decoded = await getAuth(app).verifyIdToken(idToken, true);
  } catch {
    // Firebase distinguishes expired, revoked and malformed. The caller does
    // not need to know which, and saying so helps an attacker enumerate.
    throw new Unauthorized("Firebase token verification failed");
  }

  if (!decoded.email) {
    throw new Unauthorized("Firebase token is missing the email claim");
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name || decoded.email.split("@")[0] || "User",
    emailVerified: decoded.email_verified ?? false,
  };
}

/**
 * Verifies a Firebase ID token and returns a session for the matching account,
 * creating one on first sign-in.
 */
export async function exchangeFirebaseToken(
  firebaseToken: string,
): Promise<AuthenticatedResult> {
  const info = await verifyIdToken(firebaseToken);
  const email = info.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          lastSignIn: new Date(),
          // An account that already has a password and now signs in with
          // Firebase genuinely has both. The previous code overwrote provider
          // with "firebase" either way, which lost that and left the OAuth
          // password setup flow offering to set a password that already
          // existed.
          provider: existing.password.length > 0 ? "dual" : "firebase",
          emailVerified: info.emailVerified,
        },
        select: { id: true, email: true, name: true },
      })
    : await prisma.user.create({
        data: {
          id: info.uid,
          email,
          name: info.name,
          // Firebase accounts have no local password until they set one
          // through the OAuth password setup flow.
          password: "",
          provider: "firebase",
          emailVerified: info.emailVerified,
          lastSignIn: new Date(),
        },
        select: { id: true, email: true, name: true },
      });

  return { success: true, token: signAuthToken(user), user };
}
