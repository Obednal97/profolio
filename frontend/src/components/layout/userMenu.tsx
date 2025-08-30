"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/lib/unifiedAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { getUserInitials, sanitizeText } from "@/lib/userUtils";
import { logger } from "@/lib/logger";

interface UserMenuProps {
  user?: {
    name?: string;
    email?: string;
  };
}

interface UserData {
  name?: string;
  email?: string;
}

interface MenuItemBase {
  label: string;
  icon: string;
}

interface MenuItemWithPath extends MenuItemBase {
  path: string;
  action: null;
  isInstall?: never;
  isDevelopment?: never;
}

interface MenuItemWithAction extends MenuItemBase {
  path: null;
  action: (() => void) | (() => Promise<void>);
  isInstall?: boolean;
  isDevelopment?: boolean;
}

type MenuItem = MenuItemWithPath | MenuItemWithAction;

// Safe console methods for environments where console might not exist
const safeConsole = {
  log:
    typeof console !== "undefined" && console.log
      ? console.log.bind(console)
      : () => {},
  error:
    typeof console !== "undefined" && console.error
      ? console.error.bind(console)
      : () => {},
};

export default function UserMenu({ user: propUser }: UserMenuProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { signOut, userProfile, authMode } = useAuth();
  const { unreadCount } = useNotifications();

  // Prefer prop user (from createUserContext) over raw userProfile for consistency
  const user = propUser || userProfile;

  // Debug logging to track profile updates (only in development and only on changes)
  const prevUserData = useRef<{
    propUser: UserData | null;
    userProfile: UserData | null;
    finalUser: UserData | null;
  }>({
    propUser: null,
    userProfile: null,
    finalUser: null,
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const currentData = {
        propUser: propUser
          ? { name: propUser.name, email: propUser.email }
          : null,
        userProfile: userProfile
          ? { name: userProfile.name, email: userProfile.email }
          : null,
        finalUser: user ? { name: user.name, email: user.email } : null,
      };

      // Only log if data actually changed
      const hasChanged =
        JSON.stringify(currentData.propUser) !==
          JSON.stringify(prevUserData.current.propUser) ||
        JSON.stringify(currentData.userProfile) !==
          JSON.stringify(prevUserData.current.userProfile) ||
        JSON.stringify(currentData.finalUser) !==
          JSON.stringify(prevUserData.current.finalUser);

      if (hasChanged) {
        logger.auth("UserMenu data changed:", {
          ...currentData,
          timestamp: new Date().toISOString(),
        });

        // Check for mismatch only when data changes
        if (propUser && userProfile && propUser.name !== userProfile.name) {
          logger.auth("Profile data mismatch detected:", {
            propUser: propUser.name,
            userProfile: userProfile.name,
            using: user?.name,
          });
        }

        prevUserData.current = currentData;
      }
    }
  }, [propUser, userProfile, user]);

  // Memoized user data processing to prevent recreation
  const processedUserData = useMemo(() => {
    const safeName = sanitizeText(user?.name);
    const safeEmail = sanitizeText(user?.email);

    // Create UserData-compatible object for getUserInitials
    const userData = user
      ? {
          id: "", // Not needed for initials
          email: user.email || null,
          name: user.name || null,
          displayName: user.name || null,
        }
      : null;

    const safeInitials = getUserInitials(userData);

    return {
      safeName,
      safeEmail,
      safeInitials,
    };
  }, [user]);

  // Memoized theme utilities
  const themeUtils = useMemo(
    () => ({
      icon: theme === "light" ? "fa-moon" : "fa-sun",
      tooltip:
        theme === "light" ? "Switch to dark mode" : "Switch to light mode",
    }),
    [theme]
  );

  // Optimized event handlers with useCallback
  const handleSignOut = useCallback(async () => {
    try {
      setIsProfileOpen(false);
      await signOut();
    } catch (error) {
      safeConsole.error("Sign out error:", error);
      // Use Next.js router for secure navigation
      router.push("/auth/signIn");
    }
  }, [signOut, router]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  const closeMenu = useCallback(() => {
    setIsProfileOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsProfileOpen((prev) => !prev);
  }, []);

  // Check if billing should be shown
  const showBilling = useMemo(() => {
    // Check if we're in cloud mode (Firebase auth) - use actual authMode from context
    const isCloudMode = authMode === 'firebase';
    
    // Check if user is a demo user
    const isDemoUser = typeof window !== 'undefined' && 
      (localStorage.getItem('demo-mode') === 'true' || 
       localStorage.getItem('demo-token') === 'demo-token-secure-123');
    
    // Check if running on localhost (development mode)
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '::1');
    
    // Show billing in these cases:
    // 1. Always show on localhost for testing (even for demo users)
    // 2. In production: only show in cloud mode for non-demo authenticated users
    if (isLocalhost) {
      // Development mode: always show billing for testing
      return isCloudMode && !!user;
    } else {
      // Production mode: show only for cloud non-demo users
      return isCloudMode && !isDemoUser && !!user;
    }
  }, [user, authMode]);

  // Memoized profile menu items to prevent array recreation
  const profileMenuItems = useMemo(
    (): MenuItem[] => {
      const items: MenuItem[] = [
        {
          label: "Account Settings",
          path: "/app/settings",
          icon: "fa-cog",
          action: null,
        },
      ];

      // Add billing link if conditions are met
      if (showBilling) {
        items.push({
          label: "Billing & Subscription",
          path: "/app/billing",
          icon: "fa-credit-card",
          action: null,
        });
      }

      items.push(
        {
          label: "System Updates",
          path: "/app/updates",
          icon: "fa-download",
          action: null,
        },
        {
          label: "Notifications",
          path: "/app/notifications",
          icon: "fa-bell",
          action: null,
        },
        {
          label: `Switch to ${theme === "light" ? "dark" : "light"} mode`,
          path: null,
          icon: themeUtils.icon,
          action: toggleTheme,
        },
        {
          label: "Sign Out",
          path: null,
          icon: "fa-sign-out-alt",
          action: handleSignOut,
        }
      );

      return items;
    },
    [theme, themeUtils.icon, toggleTheme, handleSignOut, showBilling]
  );

  return (
    <div className="relative flex items-center gap-3">
      {user ? (
        <>
          {/* User Avatar with glass effect */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center gap-3 py-2.5 px-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg hover:scale-105 h-11"
              aria-label="User menu"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              data-testid="user-menu"
            >
              {/* Avatar */}
              <div className="relative w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                {processedUserData.safeInitials}
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </div>
                )}
              </div>

              {/* User info (hidden on mobile and small tablets) */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                  {processedUserData.safeName || "User"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                  {processedUserData.safeEmail}
                </p>
              </div>

              {/* Dropdown arrow */}
              <i
                className={`fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              ></i>
            </button>

            {/* Dropdown Menu with enhanced glass effect */}
            {isProfileOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={closeMenu}
                  aria-hidden="true"
                />

                {/* Menu */}
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-2xl shadow-2xl z-50 py-2"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
                        {processedUserData.safeInitials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {processedUserData.safeName || "User"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {processedUserData.safeEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {profileMenuItems.map((item, index) => (
                      <div key={`${item.label}-${index}`}>
                        {item.path ? (
                          <Link
                            href={item.path}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-200"
                            onClick={closeMenu}
                            role="menuitem"
                          >
                            <i
                              className={`fas ${item.icon} w-4 text-center`}
                              aria-hidden="true"
                            ></i>
                            <span className="flex-1">{item.label}</span>
                            {item.label === "Notifications" &&
                              unreadCount > 0 && (
                                <span
                                  className="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                                  aria-label={`${unreadCount} unread notifications`}
                                >
                                  {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                              )}
                          </Link>
                        ) : (
                          <button
                            onClick={item.action || undefined}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 ${
                              item.label === "Sign Out"
                                ? "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60"
                            }`}
                            role="menuitem"
                            data-testid={
                              item.label === "Sign Out"
                                ? "logout-button"
                                : undefined
                            }
                          >
                            <i
                              className={`fas ${item.icon} w-4 text-center`}
                              aria-hidden="true"
                            ></i>
                            <span className="flex-1">{item.label}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* Theme toggle and sign in/sign up buttons for non-authenticated users */
        <div className="flex items-center gap-2">
          {/* Theme Toggle for public pages */}
          <button
            onClick={toggleTheme}
            className="h-11 w-11 flex-shrink-0 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg hover:scale-105 flex items-center justify-center"
            title={themeUtils.tooltip}
            aria-label={themeUtils.tooltip}
            data-testid="theme-toggle"
          >
            <i className={`fas ${themeUtils.icon} text-sm`}></i>
          </button>

          <Link
            href="/auth/signIn"
            className="h-11 w-11 flex-shrink-0 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-lg hover:scale-105 flex items-center justify-center"
            data-testid="sign-in-button"
            title="Sign In"
            aria-label="Sign In"
          >
            <i className="fas fa-sign-in-alt text-sm" aria-hidden="true"></i>
          </Link>
          <Link
            href="/auth/signUp"
            className="h-11 w-11 flex-shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:scale-105 flex items-center justify-center"
            data-testid="sign-up-button"
            title="Sign Up"
            aria-label="Sign Up"
          >
            <i className="fas fa-user-plus text-sm" aria-hidden="true"></i>
          </Link>
        </div>
      )}
    </div>
  );
}
