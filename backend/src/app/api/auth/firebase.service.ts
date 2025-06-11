import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import * as admin from "firebase-admin";

export interface FirebaseUserInfo {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  provider: string;
}

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  constructor() {
    this.initializeFirebaseAdmin();
  }

  /**
   * Initialize Firebase Admin SDK with environment variables
   */
  private initializeFirebaseAdmin(): void {
    try {
      // Check if Firebase is already initialized
      if (this.app) {
        return;
      }

      // Validate required environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          "Firebase Admin SDK not initialized: Missing required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
        );
        return;
      }

      // Parse private key (handle both raw key and base64 encoded)
      let formattedPrivateKey: string;
      try {
        // If the key is base64 encoded, decode it
        if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
          formattedPrivateKey = Buffer.from(privateKey, "base64").toString();
        } else {
          formattedPrivateKey = privateKey;
        }

        // Ensure proper line breaks in private key
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
      } catch (keyError: unknown) {
        const errorMessage =
          keyError instanceof Error ? keyError.message : "Unknown error";
        throw new Error(`Invalid FIREBASE_PRIVATE_KEY format: ${errorMessage}`);
      }

      // Initialize Firebase Admin SDK
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: formattedPrivateKey,
        }),
        projectId: projectId,
      });

      this.logger.log(
        `✅ Firebase Admin SDK initialized for project: ${projectId}`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to initialize Firebase Admin SDK:", error);
      throw new Error(
        `Firebase Admin SDK initialization failed: ${errorMessage}`
      );
    }
  }

  /**
   * Verify Firebase ID token and return user information
   */
  async verifyIdToken(idToken: string): Promise<FirebaseUserInfo> {
    try {
      // Check if Firebase Admin is initialized
      if (!this.app) {
        throw new HttpException(
          "Firebase Admin SDK not configured. Please set environment variables.",
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      // Validate input
      if (!idToken || typeof idToken !== "string") {
        throw new HttpException(
          "Invalid ID token provided",
          HttpStatus.BAD_REQUEST
        );
      }

      // Verify the token using Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(idToken, true);

      // Extract user information
      const userInfo: FirebaseUserInfo = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        name: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
        emailVerified: decodedToken.email_verified || false,
        provider: this.extractProvider(decodedToken),
      };

      // Validate required fields
      if (!userInfo.email) {
        throw new HttpException(
          "Firebase token missing required email claim",
          HttpStatus.UNAUTHORIZED
        );
      }

      this.logger.debug(
        `✅ Firebase token verified for user: ${userInfo.email}`
      );
      return userInfo;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Token verification failed";
      this.logger.warn(
        `❌ Firebase token verification failed: ${errorMessage}`
      );

      // Handle specific Firebase errors
      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string };

        if (firebaseError.code === "auth/id-token-expired") {
          throw new HttpException(
            "Firebase token has expired",
            HttpStatus.UNAUTHORIZED
          );
        }

        if (firebaseError.code === "auth/id-token-revoked") {
          throw new HttpException(
            "Firebase token has been revoked",
            HttpStatus.UNAUTHORIZED
          );
        }

        if (firebaseError.code === "auth/invalid-id-token") {
          throw new HttpException(
            "Invalid Firebase token",
            HttpStatus.UNAUTHORIZED
          );
        }
      }

      // Re-throw HttpExceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Generic error for security
      throw new HttpException(
        "Firebase token verification failed",
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Extract provider information from decoded token
   */
  private extractProvider(decodedToken: admin.auth.DecodedIdToken): string {
    // Check provider data for sign-in method
    if (decodedToken.firebase?.sign_in_provider) {
      return decodedToken.firebase.sign_in_provider;
    }

    // Check auth_time for manual extraction (less reliable)
    if (decodedToken.auth_time) {
      return "firebase";
    }

    return "unknown";
  }

  /**
   * Check if Firebase Admin SDK is properly configured
   */
  isConfigured(): boolean {
    return this.app !== null;
  }

  /**
   * Get Firebase project information (for debugging)
   */
  getProjectInfo(): { projectId: string | null; configured: boolean } {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || null,
      configured: this.isConfigured(),
    };
  }
}
