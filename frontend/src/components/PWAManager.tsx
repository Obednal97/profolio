"use client";

import { useEffect, useState, useCallback, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { logger } from "@/lib/logger";

interface ServiceWorkerRegistrationWithUpdate
  extends ServiceWorkerRegistration {
  updatefound?: () => void;
}

/**
 * PWA Install Prompt Preference Manager
 * Handles 7-day caching of user dismissal preferences
 */
const PWA_DISMISSAL_KEY = "pwa-install-dismissed";
const PWA_SESSION_DISMISSED_KEY = "pwa-session-dismissed"; // IMPROVEMENT: Session-level tracking
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface DismissalData {
  timestamp: number;
  dismissed: boolean;
}

/**
 * Check if PWA install prompt should be shown based on 7-day dismissal cache
 */
const getPWADismissalStatus = (): {
  isDismissed: boolean;
  daysRemaining: number;
} => {
  if (typeof window === "undefined") {
    return { isDismissed: false, daysRemaining: 0 };
  }

  try {
    const stored = localStorage.getItem(PWA_DISMISSAL_KEY);
    if (!stored) {
      return { isDismissed: false, daysRemaining: 0 };
    }

    const data: DismissalData = JSON.parse(stored);
    const now = Date.now();
    const timeElapsed = now - data.timestamp;
    const timeRemaining = DISMISSAL_DURATION - timeElapsed;

    // Check if 7 days have passed
    if (timeElapsed >= DISMISSAL_DURATION) {
      // Clear expired dismissal
      localStorage.removeItem(PWA_DISMISSAL_KEY);
      logger.pwa(
        "🔄 PWA install prompt dismissal expired after 7 days - prompt can be shown again"
      );
      return { isDismissed: false, daysRemaining: 0 };
    }

    // IMPROVEMENT: Validate that data structure is correct
    if (
      typeof data.dismissed !== "boolean" ||
      typeof data.timestamp !== "number"
    ) {
      logger.warn("Invalid PWA dismissal data structure, clearing...");
      localStorage.removeItem(PWA_DISMISSAL_KEY);
      return { isDismissed: false, daysRemaining: 0 };
    }

    // Calculate days remaining
    const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

    return {
      isDismissed: data.dismissed,
      daysRemaining,
    };
  } catch (error) {
    logger.warn("Failed to read PWA dismissal status:", error);
    // Clear corrupted data
    try {
      localStorage.removeItem(PWA_DISMISSAL_KEY);
    } catch {}
    return { isDismissed: false, daysRemaining: 0 };
  }
};

/**
 * Set PWA install prompt dismissal for 7 days
 */
const setPWADismissalStatus = (dismissed: boolean): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const data: DismissalData = {
      timestamp: Date.now(),
      dismissed,
    };

    localStorage.setItem(PWA_DISMISSAL_KEY, JSON.stringify(data));

    if (dismissed) {
      logger.pwa("🚫 PWA install prompt dismissed for 7 days");
    }

    return true;
  } catch (error) {
    logger.warn("Failed to set PWA dismissal status:", error);
    return false;
  }
};

/**
 * Clear auth-related cache from service worker
 * Useful when authentication state gets out of sync
 */
export const clearAuthCache = async (): Promise<void> => {
  if (!("serviceWorker" in navigator)) {
    logger.warn("Service Worker not supported - cannot clear auth cache");
    return;
  }

  try {
    // Send message to service worker to clear auth cache
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_AUTH_CACHE",
      });
      logger.pwa("🧹 Requested service worker to clear auth cache");
    }

    // Also clear browser caches for auth/app routes
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        const authKeys = keys.filter(
          (key) =>
            key.url.includes("/app/") ||
            key.url.includes("/auth/") ||
            key.url.includes("/api/")
        );

        await Promise.all(authKeys.map((key) => cache.delete(key)));

        if (authKeys.length > 0) {
          logger.pwa(
            `🧹 Cleared ${authKeys.length} auth-related entries from cache: ${cacheName}`
          );
        }
      })
    );
  } catch (error) {
    logger.error("Failed to clear auth cache:", error);
  }
};

/**
 * PWAManager Component
 *
 * Handles Progressive Web App functionality including:
 * - Service worker registration and updates
 * - Install prompt management (popup banner) with 7-day dismissal caching
 * - Standalone app detection
 *
 * Optimized for performance with proper cleanup and resource management
 */
const PWAManager = memo(() => {
  // PWA installation logic from custom hook
  const {
    canInstall,
    showInstallPrompt: triggerInstall,
    isInstalling,
    isStandalone,
  } = usePWAInstall();

  // State for popup banner display
  const [showBanner, setShowBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [dismissalStatusLoaded, setDismissalStatusLoaded] = useState(false);
  const [dismissalStatus, setDismissalStatus] = useState<{
    isDismissed: boolean;
    daysRemaining: number;
  }>({
    isDismissed: false,
    daysRemaining: 0,
  });

  // Refs for cleanup management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistrationWithUpdate | null>(
    null
  );
  const lastDebugLogRef = useRef<number>(0);

  const loadDismissalStatus = useCallback(() => {
    if (typeof window === "undefined") return;

    // IMPROVEMENT: Check session-level dismissal first
    const sessionDismissed =
      sessionStorage.getItem(PWA_SESSION_DISMISSED_KEY) === "true";
    if (sessionDismissed) {
      setDismissalStatus({ isDismissed: true, daysRemaining: 0 });
      setDismissalStatusLoaded(true);
      logger.pwa("🚫 PWA install prompt dismissed for this session");
      return;
    }

    const status = getPWADismissalStatus();
    setDismissalStatus(status);
    setDismissalStatusLoaded(true);

    // Debug logging in development
    if (process.env.NODE_ENV === "development" && status.isDismissed) {
      logger.pwa(
        `🔍 PWA install prompt dismissed, ${status.daysRemaining} days remaining`
      );
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      logger.warn("Service Worker not supported in this browser");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      logger.pwa(
        "🔧 PWA: Skipping service worker registration in development mode"
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      registrationRef.current = registration;

      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          const handleStateChange = () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Could emit event here for update notification
            }
          };

          newWorker.addEventListener("statechange", handleStateChange);

          return () => {
            newWorker.removeEventListener("statechange", handleStateChange);
          };
        }
      };

      registration.addEventListener("updatefound", handleUpdateFound);
    } catch (error) {
      logger.error("Service Worker registration failed:", error);
    }
  }, []);

  const handleInstallClick = useCallback(async () => {
    const success = await triggerInstall();
    if (success) {
      setShowBanner(false);
      // Clear dismissal status since user installed the app
      try {
        localStorage.removeItem(PWA_DISMISSAL_KEY);
        sessionStorage.removeItem(PWA_SESSION_DISMISSED_KEY); // IMPROVEMENT: Clear session dismissal too
        setDismissalStatus({ isDismissed: false, daysRemaining: 0 });
      } catch (error) {
        logger.warn(
          "Failed to clear PWA dismissal status after install:",
          error
        );
      }
    }
  }, [triggerInstall]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);

    // Clear timeout if user dismisses before auto-show
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // IMPROVEMENT: Set session-level dismissal to prevent showing again this session
    try {
      sessionStorage.setItem(PWA_SESSION_DISMISSED_KEY, "true");
    } catch (error) {
      logger.warn("Failed to set session dismissal:", error);
    }

    // Set 7-day dismissal preference
    const success = setPWADismissalStatus(true);
    if (success) {
      setDismissalStatus({ isDismissed: true, daysRemaining: 7 });
    }
  }, []);

  useEffect(() => {
    setIsClient(true);

    loadDismissalStatus();

    if (document.readyState === "loading") {
      window.addEventListener("load", registerServiceWorker, { once: true });
    } else {
      registerServiceWorker();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      window.removeEventListener("load", registerServiceWorker);
    };
  }, [registerServiceWorker, loadDismissalStatus]);

  useEffect(() => {
    if (!dismissalStatusLoaded) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      const now = Date.now();
      if (now - lastDebugLogRef.current > 5000) {
        logger.pwa("🔍 PWA Debug:", {
          isClient,
          canInstall,
          isStandalone,
          showBanner,
          isDismissed: dismissalStatus.isDismissed,
          daysRemaining: dismissalStatus.daysRemaining,
          dismissalStatusLoaded,
          displayMode: window.matchMedia?.("(display-mode: standalone)")
            ?.matches,
          navigatorStandalone: navigator?.standalone,
        });
        lastDebugLogRef.current = now;
      }
    }

    if (isStandalone) {
      if (showBanner) {
        logger.pwa("📱 PWA already installed - hiding banner");
        setShowBanner(false);
      }

      // Clear dismissal storage since app is installed (only if it exists)
      const stored = localStorage.getItem(PWA_DISMISSAL_KEY);
      const sessionStored = sessionStorage.getItem(PWA_SESSION_DISMISSED_KEY);
      if (stored || sessionStored) {
        try {
          localStorage.removeItem(PWA_DISMISSAL_KEY);
          sessionStorage.removeItem(PWA_SESSION_DISMISSED_KEY); // IMPROVEMENT: Clear session dismissal too
          setDismissalStatus({ isDismissed: false, daysRemaining: 0 });
        } catch (error) {
          logger.warn("Failed to clear dismissal storage:", error);
        }
      }
      return;
    }

    if (dismissalStatus.isDismissed) {
      if (showBanner) {
        logger.pwa(
          `📅 PWA install prompt dismissed, ${dismissalStatus.daysRemaining} days remaining`
        );
        setShowBanner(false);
      }
      return;
    }

    if (canInstall && !dismissalStatus.isDismissed && !showBanner) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    canInstall,
    showBanner,
    isStandalone,
    isClient,
    dismissalStatus.isDismissed,
    dismissalStatus.daysRemaining,
    dismissalStatusLoaded,
  ]);

  const isStandaloneMode =
    isStandalone ||
    (typeof window !== "undefined" &&
      window.matchMedia?.("(display-mode: standalone)")?.matches) ||
    (typeof navigator !== "undefined" && navigator.standalone === true);

  if (
    !isClient ||
    !dismissalStatusLoaded ||
    !showBanner ||
    !canInstall ||
    isStandaloneMode ||
    dismissalStatus.isDismissed
  ) {
    return null;
  }

  return (
    <div
      className="fixed left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-[60] border border-blue-500/20 md:bottom-4"
      style={{
        bottom: "calc(80px + 1rem)",
      }}
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="pwa-install-title" className="font-semibold text-sm">
              Install Profolio
            </h3>
            <p
              id="pwa-install-description"
              className="text-xs text-blue-100 mt-1"
            >
              Add to your home screen for the best experience
            </p>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="glass-ghost"
          size="sm"
          className="p-1 h-auto flex-shrink-0"
          aria-label="Dismiss install prompt for 7 days"
          disabled={isInstalling}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleInstallClick}
          variant="glass-primary"
          className="flex-1 text-sm"
          aria-describedby="pwa-install-description"
          disabled={isInstalling}
        >
          {isInstalling ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
              Installing...
            </>
          ) : (
            "Install App"
          )}
        </Button>
        <Button
          onClick={handleDismiss}
          variant="glass-ghost"
          className="text-sm"
          disabled={isInstalling}
          title="Don't show again for 7 days"
        >
          Not now
        </Button>
      </div>
    </div>
  );
});

PWAManager.displayName = "PWAManager";

export default PWAManager;
