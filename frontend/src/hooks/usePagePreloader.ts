'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PreloadOptions {
  delay?: number;           // Delay before starting preload (ms)
}

/**
 * Intelligent page preloader hook
 * Preloads specified routes after a delay to improve navigation performance
 */
export function usePagePreloader(
  routes: string[],
  options: PreloadOptions = {}
) {
  const router = useRouter();
  const preloadedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    delay = 2000        // Wait 2 seconds after component mount
  } = options;

  const preloadRoute = useCallback(async (route: string) => {
    // Skip if already preloaded
    if (preloadedRef.current.has(route)) {
      return;
    }

    try {
      console.log(`🚀 Preloading route: ${route}`);

      // Use Next.js built-in prefetching (efficient, no actual HTTP requests)
      await router.prefetch(route);

      // Mark as preloaded
      preloadedRef.current.add(route);
      console.log(`✅ Successfully preloaded: ${route}`);
      
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`⚠️ Error preloading ${route}:`, error.message);
      }
    }
  }, [router]);

  const startPreloading = useCallback(async () => {
    console.log(`🎯 Starting intelligent preload of ${routes.length} routes...`);
    
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
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('🎉 Preloading completed!');
  }, [routes, preloadRoute]);

  // Start preloading after delay
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start preloading after delay
    timeoutRef.current = setTimeout(() => {
      startPreloading();
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startPreloading, delay]);

  // Return preload status and manual trigger
  return {
    preloadedRoutes: Array.from(preloadedRef.current),
    isPreloaded: (route: string) => preloadedRef.current.has(route),
    triggerPreload: startPreloading,
    clearPreloadCache: () => {
      preloadedRef.current.clear();
      console.log('🧹 Preload cache cleared');
    }
  };
}

/**
 * Preloader for main app pages
 * Use this on the dashboard to preload other sections
 */
export function useAppPagePreloader(options?: PreloadOptions) {
  const appRoutes = [
    '/app/assetManager',
    '/app/expenseManager', 
    '/app/propertyManager',
    '/app/portfolio',
    '/app/notifications',
    '/app/settings'
  ];

  return usePagePreloader(appRoutes, {
    delay: 3000,        // Wait 3 seconds for dashboard to settle
    ...options
  });
} 