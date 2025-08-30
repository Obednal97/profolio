"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { HeaderLayout } from "./headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import DemoModeBanner from "@/components/layout/DemoModeBanner";
import MobileBottomNav from "@/components/navigation/mobileBottomNav";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { useAuth } from "@/lib/unifiedAuth";
import { createUserContext } from "@/lib/userUtils";
import { motion } from "framer-motion";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// App context for currency only (theme is handled by theme-provider)
interface AppContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

/**
 * Layout wrapper that provides consistent header and user context across the app
 * Uses centralized user utilities for consistent display logic
 */
export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [currency, setCurrencyState] = useState<string>("USD");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Safe auth hook usage - call unconditionally but handle errors
  const { user, userProfile } = useAuth();

  // Use ref to track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is in demo mode
  const isDemoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("demo-mode") === "true";

  // Create consistent user context using centralized utility
  const currentUser = useMemo(() => {
    return createUserContext(user, userProfile, isDemoMode);
  }, [user, userProfile, isDemoMode]);

  // Cleanup function for abort controller
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Load user preferences from localStorage (skip API for now since it's not critical)
  useEffect(() => {
    if (!mounted) return;

    const loadUserPreferences = async () => {
      if (!preferencesLoaded) {
        // Use localStorage for currency preferences
        const savedCurrency = localStorage.getItem("currency") || "USD";
        setCurrencyState(savedCurrency);
        setPreferencesLoaded(true);
      }
    };

    loadUserPreferences();
  }, [preferencesLoaded, mounted]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);

    // Save to localStorage as backup
    if (mounted) {
      localStorage.setItem("currency", newCurrency);
    }

    // Save to user preferences if user is logged in
    if (currentUser?.id) {
      // Note: User preference saving to backend will be implemented when user profile API is available
      console.log(
        `Currency preference "${newCurrency}" saved locally for user ${currentUser.id}`
      );
    }
  };

  const formatCurrency = (amount: number) => {
    // Convert cents to currency units if amount is large (assuming it's in cents)
    const value = amount > 1000 ? amount / 100 : amount;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: "symbol",
    }).format(value);
  };

  const appValue = {
    currency,
    setCurrency,
    formatCurrency,
  };

  // Define which paths should not show the header (only auth pages)
  const hideHeaderPaths = [
    "/auth/signIn",
    "/auth/signUp",
    "/auth/forgotPassword",
  ];

  const shouldShowHeader = !hideHeaderPaths.includes(pathname);

  // For public pages, don't pass user data (will show sign in buttons)
  // For app pages, pass user data (will show user menu)
  const isAppSection = pathname.startsWith("/app");
  const headerUser =
    isAppSection && currentUser
      ? {
          name: currentUser.name,
          email: currentUser.email,
        }
      : undefined;

  // Don't render layout until mounted to prevent hydration issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AppContext.Provider value={appValue}>
      <>
        {/* 🚀 OFFLINE UX: Global network status indicator */}
        <NetworkStatus position="top" />

        {/* Animated background for app pages */}
        {isAppSection && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <motion.div
              className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-indigo-300 rounded-full opacity-20 dark:opacity-15 filter blur-3xl gradient-animation"
              animate={{
                x: [0, 50, -30, 0],
                y: [0, -30, 50, 0],
                scale: [1, 1.1, 0.9, 1],
              }}
              transition={{
                duration: 24,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            />
            <motion.div
              className="absolute top-1/4 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-300 rounded-full opacity-20 dark:opacity-15 filter blur-3xl gradient-animation"
              animate={{
                x: [0, -40, 30, 0],
                y: [0, 40, -30, 0],
                scale: [1, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 28,
                ease: "easeInOut",
                repeat: Infinity,
                delay: 4,
              }}
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full opacity-20 dark:opacity-15 filter blur-3xl gradient-animation"
              animate={{
                x: [0, 30, -30, 0],
                y: [0, -30, 30, 0],
                scale: [1, 1.2, 0.8, 1],
              }}
              transition={{
                duration: 30,
                ease: "easeInOut",
                repeat: Infinity,
                delay: 8,
              }}
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            />
            <motion.div
              className="absolute top-3/4 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-300 rounded-full opacity-15 dark:opacity-10 filter blur-3xl gradient-animation"
              animate={{
                x: [0, 45, -35, 0],
                y: [0, -35, 45, 0],
                scale: [1, 1.05, 0.95, 1],
              }}
              transition={{
                duration: 26,
                ease: "easeInOut",
                repeat: Infinity,
                delay: 6,
              }}
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            />
            <motion.div
              className="absolute bottom-10 left-1/4 w-80 h-80 bg-gradient-to-tr from-orange-400 to-red-300 rounded-full opacity-15 dark:opacity-10 filter blur-3xl gradient-animation"
              animate={{
                x: [0, -40, 45, 0],
                y: [0, 45, -40, 0],
                scale: [1, 1.15, 0.85, 1],
              }}
              transition={{
                duration: 32,
                ease: "easeInOut",
                repeat: Infinity,
                delay: 12,
              }}
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
            />
          </div>
        )}

        {/* Demo Mode Banner - only appears in authenticated areas when in demo mode */}
        {isDemoMode && isAppSection && shouldShowHeader && <DemoModeBanner />}

        {shouldShowHeader && (
          <HeaderLayout user={headerUser} currentPath={pathname} />
        )}
        <main className={`relative z-10 ${headerUser ? "pb-8 md:pb-0" : ""}`}>
          {children}
        </main>
        {!hideHeaderPaths.includes(pathname) && <Footer />}

        {/* Mobile Bottom Navigation - now shows for all users except auth pages */}
        {!hideHeaderPaths.includes(pathname) && (
          <MobileBottomNav user={headerUser} currentPath={pathname} />
        )}

        {/* Add bottom padding for mobile navigation on pages where it's visible */}
        {!hideHeaderPaths.includes(pathname) && (
          <div className="h-20 md:hidden"></div>
        )}
      </>
    </AppContext.Provider>
  );
}
