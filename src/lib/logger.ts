/**
 * Production-safe logging utility
 * Only logs in development mode to prevent console pollution in production
 */

export const logger = {
  /**
   * Development-only info logging
   */
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Development-only warning logging
   */
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Error logging (always enabled for debugging)
   */
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  /**
   * Debug logging (development only)
   */
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Authentication logging (development only, sensitive data)
   */
  auth: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUTH] ${message}`, ...args);
    }
  },

  /**
   * Cache/Performance logging (development only)
   */
  cache: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[CACHE] ${message}`, ...args);
    }
  },

  /**
   * PWA/Service Worker logging (development only)
   */
  pwa: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[PWA] ${message}`, ...args);
    }
  },

  /**
   * Preloading/Navigation logging (development only)
   */
  preload: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[PRELOAD] ${message}`, ...args);
    }
  },

  /**
   * Firebase configuration logging (development only)
   */
  firebase: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[FIREBASE] ${message}`, ...args);
    }
  },
};
