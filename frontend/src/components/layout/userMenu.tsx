"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/lib/unifiedAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { getUserInitials, sanitizeText } from "@/lib/userUtils";

interface UserMenuProps {
  user?: {
    name?: string;
    email?: string;
  };
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
  log: typeof console !== 'undefined' && console.log ? console.log.bind(console) : () => {},
  error: typeof console !== 'undefined' && console.error ? console.error.bind(console) : () => {},
};

export default function UserMenu({ user: propUser }: UserMenuProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { signOut, userProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const { canInstall, showInstallPrompt, isInstalling, isStandalone } = usePWAInstall();

  // Use auth context userProfile if available, fallback to prop user
  const user = userProfile || propUser;

  // Memoized user data processing to prevent recreation
  const processedUserData = useMemo(() => {
    const safeName = sanitizeText(user?.name);
    const safeEmail = sanitizeText(user?.email);
    
    // Create UserData-compatible object for getUserInitials
    const userData = user ? {
      id: '', // Not needed for initials
      email: user.email || null,
      name: user.name || null,
      displayName: user.name || null,
    } : null;
    
    const safeInitials = getUserInitials(userData);

    return {
      safeName,
      safeEmail,
      safeInitials,
    };
  }, [user]);

  // Memoized theme utilities
  const themeUtils = useMemo(() => ({
    icon: theme === "light" ? "fa-moon" : "fa-sun",
    tooltip: theme === "light" ? "Switch to dark mode" : "Switch to light mode",
  }), [theme]);

  // Optimized event handlers with useCallback
  const handleSignOut = useCallback(async () => {
    try {
      setIsProfileOpen(false);
      await signOut();
    } catch (error) {
      safeConsole.error('Sign out error:', error);
      // Use Next.js router for secure navigation
      router.push('/auth/signIn');
    }
  }, [signOut, router]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const handleInstallApp = useCallback(async () => {
    setIsProfileOpen(false);
    await showInstallPrompt();
  }, [showInstallPrompt]);

  // Development utility to reset PWA state (only in development) - memoized
  const handleResetPWAState = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      try {
        localStorage.removeItem('pwa-installed');
        localStorage.removeItem('pwa-prompt-dismissed');
        sessionStorage.removeItem('pwa-prompt-dismissed');
        setIsProfileOpen(false);
        safeConsole.log('🔄 PWA state reset - reload page to test installation again');
        // Use window.location.reload() only in development for testing
        window.location.reload();
      } catch (error) {
        safeConsole.error('Failed to reset PWA state:', error);
      }
    }
  }, []);

  const closeMenu = useCallback(() => {
    setIsProfileOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsProfileOpen(prev => !prev);
  }, []);

  // Memoized profile menu items to prevent array recreation
  const profileMenuItems = useMemo((): MenuItem[] => [
    { label: "Account Settings", path: "/app/settings", icon: "fa-cog", action: null },
    { label: "System Updates", path: "/app/updates", icon: "fa-download", action: null },
    { label: "Notifications", path: "/app/notifications", icon: "fa-bell", action: null },
    // Add Install App option when available (only if not standalone and can install)
    ...(canInstall && !isStandalone ? [{ 
      label: "Install App", 
      path: null, 
      icon: "fa-mobile-alt", 
      action: handleInstallApp,
      isInstall: true
    } as MenuItem] : []),
    // Development reset option (only in development and when PWA is detected as installed)
    ...(process.env.NODE_ENV === 'development' && isStandalone ? [{ 
      label: "Reset PWA State", 
      path: null, 
      icon: "fa-undo", 
      action: handleResetPWAState,
      isDevelopment: true
    } as MenuItem] : []),
    { 
      label: `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`, 
      path: null, 
      icon: themeUtils.icon, 
      action: toggleTheme 
    },
    { label: "Sign Out", path: null, icon: "fa-sign-out-alt", action: handleSignOut },
  ], [canInstall, isStandalone, handleInstallApp, handleResetPWAState, theme, themeUtils.icon, toggleTheme, handleSignOut]);

  // Memoized debug info for development (only when values change)
  useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      const info = {
        canInstall,
        isStandalone,
        isInstalling,
        showInstallOption: canInstall && !isStandalone,
        menuItemsCount: profileMenuItems.length
      };
      safeConsole.log('🔍 UserMenu PWA State:', info);
    }
  }, [canInstall, isStandalone, isInstalling, profileMenuItems.length]);

  return (
    <div className="relative flex items-center gap-3">
      {/* Theme Toggle with glass effect - hidden on mobile, moved to user menu */}
      <button
        onClick={toggleTheme}
        className="hidden md:flex h-11 w-11 flex-shrink-0 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg hover:scale-105 items-center justify-center"
        title={themeUtils.tooltip}
        aria-label={themeUtils.tooltip}
      >
        <i className={`fas ${themeUtils.icon} text-sm`}></i>
      </button>

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
            >
              {/* Avatar */}
              <div className="relative w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                {processedUserData.safeInitials}
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </div>
              
              {/* User info (hidden on mobile and small tablets) */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                  {processedUserData.safeName || 'User'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                  {processedUserData.safeEmail}
                </p>
              </div>

              {/* Dropdown arrow */}
              <i className={`fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}></i>
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
                        <p className="font-medium text-gray-900 dark:text-white">{processedUserData.safeName || 'User'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{processedUserData.safeEmail}</p>
                        {/* PWA Status indicator in development */}
                        {process.env.NODE_ENV === 'development' && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            PWA: {isStandalone ? 'Installed' : canInstall ? 'Available' : 'Not Available'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {profileMenuItems.map((item, index) => (
                      <div key={`${item.label}-${index}`} className={`${item.label.includes('mode') ? 'md:hidden' : ''}`}>
                        {item.path ? (
                          <Link
                            href={item.path}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-200"
                            onClick={closeMenu}
                            role="menuitem"
                          >
                            <i className={`fas ${item.icon} w-4 text-center`} aria-hidden="true"></i>
                            <span className="flex-1">{item.label}</span>
                            {item.label === "Notifications" && unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full" aria-label={`${unreadCount} unread notifications`}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <button
                            onClick={item.action || undefined}
                            disabled={item.isInstall && isInstalling}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 ${
                              item.isInstall 
                                ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed' 
                                : item.isDevelopment
                                ? 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : item.label === 'Sign Out'
                                ? 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                            }`}
                            role="menuitem"
                            aria-disabled={item.isInstall && isInstalling}
                          >
                            <i className={`fas ${item.icon} w-4 text-center ${isInstalling && item.isInstall ? 'animate-pulse' : ''}`} aria-hidden="true"></i>
                            <span className="flex-1">
                              {item.isInstall && isInstalling ? 'Installing...' : item.label}
                            </span>
                            {item.isInstall && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full" aria-label="Progressive Web App">
                                PWA
                              </span>
                            )}
                            {item.isDevelopment && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full" aria-label="Development tool">
                                DEV
                              </span>
                            )}
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
        /* Sign in and sign up buttons for non-authenticated users */
        <div className="flex items-center gap-2">
          <Link
            href="/auth/signIn"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-lg hover:scale-105"
          >
            <i className="fas fa-sign-in-alt text-sm" aria-hidden="true"></i>
            <span className="hidden sm:inline">Sign In</span>
          </Link>
          <Link
            href="/auth/signUp"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:scale-105"
          >
            <i className="fas fa-user-plus text-sm" aria-hidden="true"></i>
            <span className="hidden sm:inline">Sign Up</span>
          </Link>
        </div>
      )}
    </div>
  );
}
