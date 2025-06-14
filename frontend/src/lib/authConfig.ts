// Authentication Configuration
// Determines whether to use Firebase (hosted) or Local (self-hosted) authentication

import { logger } from "@/lib/logger";

export interface AuthConfig {
  mode: "local" | "firebase";
  enableGoogleAuth: boolean;
  enableDemoMode: boolean;
  backendUrl: string;
}

// Get Firebase configuration from environment variables
function getFirebaseConfigFromEnv() {
  if (typeof window === "undefined") return null;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Return config only if apiKey is available (minimum required)
  return config.apiKey ? config : null;
}

// Detect authentication mode based on environment and configuration
function detectAuthMode(): AuthConfig["mode"] {
  // Priority 1: Environment variable (highest priority)
  const forcedMode = process.env.NEXT_PUBLIC_AUTH_MODE as
    | "local"
    | "firebase"
    | undefined;
  if (forcedMode) {
    logger.auth("Auth mode set by environment variable:", forcedMode);
    return forcedMode;
  }

  // Priority 2: Check if Firebase config is available via environment variables
  const envFirebaseConfig = getFirebaseConfigFromEnv();
  if (envFirebaseConfig) {
    logger.auth("Auth mode: firebase (environment config available)");
    return "firebase";
  }

  // Priority 3: Check if Firebase config file is available
  const hasFirebaseConfigFile =
    typeof window !== "undefined" &&
    localStorage.getItem("firebase-config-available") === "true";

  if (hasFirebaseConfigFile) {
    logger.auth("Auth mode: firebase (config file available)");
    return "firebase";
  }

  // Priority 4: Check if we're on localhost (self-hosted) - ONLY if no explicit config
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  if (isLocalhost) {
    logger.auth("Auth mode: local (localhost detected, no Firebase config)");
    return "local";
  }

  // Priority 5: Default fallback to local mode
  logger.auth("Auth mode: local (default fallback)");
  return "local";
}

// Check if Firebase config is available (environment or file)
async function checkFirebaseAvailability(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // First check environment variables
  const envConfig = getFirebaseConfigFromEnv();
  if (envConfig) {
    logger.auth("✅ Firebase config available via environment variables");
    localStorage.setItem("firebase-config-available", "true");
    return true;
  }

  // Fallback to config file check
  try {
    const response = await fetch("/firebase-config.json");
    const isAvailable = response.ok;

    if (isAvailable) {
      logger.auth("✅ Firebase config available via config file");
    } else {
      logger.auth("❌ No Firebase config file found");
    }

    localStorage.setItem("firebase-config-available", isAvailable.toString());
    return isAvailable;
  } catch (error) {
    logger.auth("❌ Firebase config file check failed:", error);
    localStorage.setItem("firebase-config-available", "false");
    return false;
  }
}

// Get Firebase configuration (environment variables first, then file)
export async function getFirebaseConfig() {
  // Try environment variables first
  const envConfig = getFirebaseConfigFromEnv();
  if (envConfig) {
    logger.auth("🔧 Using Firebase config from environment variables");
    return envConfig;
  }

  // Fallback to firebase-config.json for backward compatibility
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/firebase-config.json");
      if (response.ok) {
        const config = await response.json();
        logger.auth("🔧 Using Firebase config from config file");
        return config;
      }
    } catch (error) {
      logger.auth("Failed to load firebase-config.json:", error);
    }
  }

  logger.auth("⚠️ No Firebase configuration available");
  return null;
}

// Get authentication configuration
export async function getAuthConfig(): Promise<AuthConfig> {
  // Check Firebase availability first
  await checkFirebaseAvailability();

  const mode = detectAuthMode();

  // Automatically determine backend URL with proper protocol
  const getBackendUrl = () => {
    // Use environment variable if available
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    // Auto-detect protocol and host for production
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      // In production, use same protocol as frontend
      if (protocol === "https:") {
        // For HTTPS, assume backend is on port 3001 with HTTPS
        return `https://${hostname}:3001`;
      }
    }

    // Development fallback
    return "http://localhost:3001";
  };

  return {
    mode,
    enableGoogleAuth: mode === "firebase", // Only enable Google auth for Firebase mode
    enableDemoMode: true, // Always allow demo mode
    backendUrl: getBackendUrl(),
  };
}

// Auth mode detection for immediate use (synchronous)
export function getAuthModeSync(): AuthConfig["mode"] {
  if (typeof window === "undefined") return "local";

  // Priority 1: Environment variable
  const forcedMode = process.env.NEXT_PUBLIC_AUTH_MODE as
    | "local"
    | "firebase"
    | undefined;
  if (forcedMode) return forcedMode;

  // Priority 2: Environment Firebase config
  const envConfig = getFirebaseConfigFromEnv();
  if (envConfig) return "firebase";

  // Priority 3: Config file availability
  const hasFirebaseConfigFile =
    localStorage.getItem("firebase-config-available") === "true";
  if (hasFirebaseConfigFile) return "firebase";

  // Priority 4: Localhost detection - ONLY if no explicit config
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (isLocalhost) return "local";

  // Priority 5: Default to local
  return "local";
}

// Environment-specific settings
export const authSettings = {
  // Password requirements
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // Session settings
  tokenExpiry: "7d",
  rememberMe: true,

  // UI settings
  showProviderLabels: true,
  allowAccountCreation: true,
  showForgotPassword: true,
};
