"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

interface PreloadOptions {
  delay?: number; // Delay before starting preload (ms)
  shouldRun?: boolean; // Condition that determines if preloading should run
  sessionKey?: string; // Key to track preloading in session storage
}

// 🚀 ENHANCEMENT: Helper function to preload critical assets for a route
const preloadCriticalAssets = async (route: string) => {
  try {
    // Preload route-specific images and icons
    const criticalAssets = getCriticalAssetsForRoute(route);

    const promises = criticalAssets.map((asset) => {
      return new Promise<void>((resolve) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = asset.href;
        link.as = asset.as;
        if (asset.type) link.type = asset.type;

        link.onload = () => {
          document.head.removeChild(link);
          resolve();
        };
        link.onerror = () => {
          document.head.removeChild(link);
          resolve(); // Don't fail the whole preload for one asset
        };

        document.head.appendChild(link);
      });
    });

    await Promise.allSettled(promises);
    logger.preload(`📦 Preloaded ${criticalAssets.length} assets for ${route}`);
  } catch (error) {
    logger.warn(`⚠️ Asset preload failed for ${route}:`, error);
  }
};

// 🚀 ENHANCEMENT: Helper function to preload component chunks for a route
const preloadComponentChunks = async (route: string) => {
  try {
    // Get the route-specific chunks that need preloading
    const chunks = getComponentChunksForRoute(route);

    const promises = chunks.map((chunk) => {
      return new Promise<void>((resolve) => {
        const script = document.createElement("link");
        script.rel = "preload";
        script.href = chunk;
        script.as = "script";

        script.onload = () => {
          document.head.removeChild(script);
          resolve();
        };
        script.onerror = () => {
          document.head.removeChild(script);
          resolve(); // Don't fail for individual chunks
        };

        document.head.appendChild(script);
      });
    });

    await Promise.allSettled(promises);
    logger.preload(
      `🧩 Preloaded ${chunks.length} component chunks for ${route}`
    );
  } catch (error) {
    logger.warn(`⚠️ Chunk preload failed for ${route}:`, error);
  }
};

// 🚀 ENHANCEMENT: Get critical assets for each route
const getCriticalAssetsForRoute = (
  route: string
): Array<{ href: string; as: string; type?: string }> => {
  const baseAssets = [
    { href: "/icons/icon-32x32.png", as: "image" },
    { href: "/manifest.json", as: "fetch", type: "application/json" },
  ];

  // Route-specific assets
  const routeAssets: Record<
    string,
    Array<{ href: string; as: string; type?: string }>
  > = {
    "/app/assetManager": [
      { href: "/_next/static/css/charts.css", as: "style" }, // If you have separate CSS
    ],
    "/app/portfolio": [
      { href: "/_next/static/css/portfolio.css", as: "style" },
    ],
    "/app/dashboard": [
      { href: "/_next/static/css/dashboard.css", as: "style" },
    ],
  };

  return [...baseAssets, ...(routeAssets[route] || [])];
};

// 🚀 ENHANCEMENT: Get component chunks for each route
const getComponentChunksForRoute = (route: string): string[] => {
  // Map routes to their likely component chunks
  // In production, these would be determined by your build process
  const routeChunks: Record<string, string[]> = {
    "/app/assetManager": [
      "/_next/static/chunks/framer-motion.js",
      "/_next/static/chunks/recharts.js",
      "/_next/static/chunks/assetManager.js",
    ],
    "/app/portfolio": [
      "/_next/static/chunks/framer-motion.js",
      "/_next/static/chunks/portfolio.js",
    ],
    "/app/dashboard": [
      "/_next/static/chunks/react-confetti.js",
      "/_next/static/chunks/dashboard.js",
    ],
    "/app/propertyManager": ["/_next/static/chunks/propertyManager.js"],
    "/app/expenseManager": ["/_next/static/chunks/expenseManager.js"],
    "/app/notifications": ["/_next/static/chunks/notifications.js"],
    "/app/settings": ["/_next/static/chunks/settings.js"],
  };

  return routeChunks[route] || [];
};

/**
 * Intelligent page preloader hook
 * Preloads specified routes after a delay to improve navigation performance
 * Only runs when shouldRun condition is met and hasn't run in current session
 */
export function usePagePreloader(
  routes: string[],
  options: PreloadOptions = {}
) {
  const router = useRouter();
  const preloadedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [hasPreloadedThisSession, setHasPreloadedThisSession] = useState(false);

  const {
    delay = 2000, // Wait 2 seconds after component mount
    shouldRun = true, // By default, always run (for backward compatibility)
    sessionKey = "default-preload-session", // Default session key
  } = options;

  // Check if preloading has already occurred this session
  const hasPreloadedInSession = useCallback(() => {
    if (typeof window === "undefined") return false;
    const sessionKey_actual = `preload-completed-${sessionKey}`;
    return (
      sessionStorage.getItem(sessionKey_actual) === "true" ||
      hasPreloadedThisSession
    );
  }, [sessionKey, hasPreloadedThisSession]);

  // Mark preloading as completed for this session
  const markPreloadCompleted = useCallback(() => {
    if (typeof window === "undefined") return;
    const sessionKey_actual = `preload-completed-${sessionKey}`;
    sessionStorage.setItem(sessionKey_actual, "true");
    setHasPreloadedThisSession(true);
  }, [sessionKey]);

  const preloadRoute = useCallback(
    async (route: string) => {
      // Skip if already preloaded
      if (preloadedRef.current.has(route)) {
        return;
      }

      try {
        logger.preload(`🚀 Starting comprehensive preload for: ${route}`);

        // 🚀 ENHANCEMENT: Comprehensive preloading strategy
        // 1. Prefetch the route (Next.js built-in)
        await router.prefetch(route);
        logger.preload(`✅ Route prefetched: ${route}`);

        // 2. Preload critical static assets for the route
        await preloadCriticalAssets(route);

        // 3. Preload route-specific component chunks
        await preloadComponentChunks(route);

        // Mark as preloaded
        preloadedRef.current.add(route);
        logger.preload(`🎉 Successfully preloaded all resources for: ${route}`);
      } catch (error) {
        if (error instanceof Error) {
          // 🚀 PERFORMANCE: Reduce console noise - only log significant preload errors
          if (
            !error.message.includes("404") &&
            !error.message.includes("401")
          ) {
            logger.warn(`⚠️ Error preloading ${route}:`, error.message);
          }
        }
      }
    },
    [router]
  );

  const startPreloading = useCallback(async () => {
    // Skip if conditions not met
    if (!shouldRun || hasPreloadedInSession()) {
      logger.preload(
        `⏭️ Skipping preload - shouldRun: ${shouldRun}, hasPreloadedInSession: ${hasPreloadedInSession()}`
      );
      return;
    }

    logger.preload(
      `🎯 Starting intelligent preload of ${routes.length} routes after authentication...`
    );

    // Cancel any existing preload operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Preload routes sequentially with small delays to avoid overwhelming the browser
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        break;
      }

      await preloadRoute(route);

      // Small delay between preloads to be nice to the browser
      if (i < routes.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Mark as completed for this session
    markPreloadCompleted();
    logger.preload("Post-authentication preloading completed!");
  }, [
    routes,
    preloadRoute,
    shouldRun,
    hasPreloadedInSession,
    markPreloadCompleted,
  ]);

  // Start preloading after delay, but only if conditions are met
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only start if conditions are met
    if (shouldRun && !hasPreloadedInSession()) {
      logger.preload(`⏰ Scheduling preload in ${delay}ms...`);
      timeoutRef.current = setTimeout(() => {
        startPreloading();
      }, delay);
    } else {
      logger.preload(
        `🚫 Preload conditions not met - shouldRun: ${shouldRun}, hasPreloadedInSession: ${hasPreloadedInSession()}`
      );
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startPreloading, delay, shouldRun, hasPreloadedInSession]);

  // Return preload status and manual trigger
  return {
    preloadedRoutes: Array.from(preloadedRef.current),
    isPreloaded: (route: string) => preloadedRef.current.has(route),
    triggerPreload: startPreloading,
    clearPreloadCache: () => {
      preloadedRef.current.clear();
      logger.preload("Preload cache cleared");
    },
    hasPreloadedThisSession: hasPreloadedThisSession || hasPreloadedInSession(),
    clearSessionCache: () => {
      if (typeof window !== "undefined") {
        const sessionKey_actual = `preload-completed-${sessionKey}`;
        sessionStorage.removeItem(sessionKey_actual);
        setHasPreloadedThisSession(false);
        logger.preload("Session preload cache cleared");
      }
    },
  };
}

/**
 * Preloader for main app pages
 * Use this on the dashboard to preload other sections after authentication
 */
export function useAppPagePreloader(
  options?: PreloadOptions & {
    isPostAuthentication?: boolean;
  }
) {
  const appRoutes = [
    "/app/assetManager",
    "/app/expenseManager",
    "/app/propertyManager",
    "/app/portfolio",
    "/app/notifications",
    "/app/settings",
  ];

  const { isPostAuthentication = false, ...otherOptions } = options || {};

  return usePagePreloader(appRoutes, {
    delay: 2000, // Wait 2 seconds for dashboard to settle
    shouldRun: isPostAuthentication, // Only run when user has just authenticated
    sessionKey: "app-pages", // Track app pages preloading separately
    ...otherOptions,
  });
}
