"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/lib/unifiedAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { getUserInitials, sanitizeText } from "@/lib/userUtils";

interface UserMenuProps {
  user?: {
    name?: string;
    email?: string;
  };
}

export default function UserMenu({ user: propUser }: UserMenuProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { signOut, userProfile } = useAuth();
  const { unreadCount } = useNotifications();

  // Use auth context userProfile if available, fallback to prop user
  const user = userProfile || propUser;

  // Use centralized utilities for consistent user display
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

  const handleSignOut = async () => {
    try {
      setIsProfileOpen(false);
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if sign out fails
      window.location.href = '/auth/signIn';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getThemeIcon = () => {
    return theme === "light" ? "fa-moon" : "fa-sun";
  };

  const getThemeTooltip = () => {
    return theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  };

  const profileMenuItems = [
    { label: "Account Settings", path: "/app/settings", icon: "fa-cog", action: null },
    { label: "System Updates", path: "/app/updates", icon: "fa-download", action: null },
    { label: "Notifications", path: "/app/notifications", icon: "fa-bell", action: null },
    { 
      label: `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`, 
      path: null, 
      icon: getThemeIcon(), 
      action: toggleTheme 
    },
    { label: "Sign Out", path: null, icon: "fa-sign-out-alt", action: handleSignOut },
  ];

  return (
    <div className="relative flex items-center gap-3">
      {/* Theme Toggle with glass effect - hidden on mobile, moved to user menu */}
      <button
        onClick={toggleTheme}
        className="hidden md:flex h-11 w-11 flex-shrink-0 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg hover:scale-105 items-center justify-center"
        title={getThemeTooltip()}
        aria-label={getThemeTooltip()}
      >
        <i className={`fas ${getThemeIcon()} text-sm`}></i>
      </button>

      {user ? (
        <>
          {/* User Avatar with glass effect */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 py-2.5 px-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg hover:scale-105 h-11"
              aria-label="User menu"
            >
              {/* Avatar */}
              <div className="relative w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                {safeInitials}
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
                  {safeName || 'User'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                  {safeEmail}
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
                  onClick={() => setIsProfileOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-2xl shadow-2xl z-50 py-2">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
                        {safeInitials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{safeName || 'User'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{safeEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {profileMenuItems.map((item, index) => (
                      <div key={index} className={`${item.label.includes('mode') ? 'md:hidden' : ''}`}>
                        {item.path ? (
                          <Link
                            href={item.path}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-200"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <i className={`fas ${item.icon} w-4 text-center`}></i>
                            <span className="flex-1">{item.label}</span>
                            {item.label === "Notifications" && unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <button
                            onClick={item.action || undefined}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                          >
                            <i className={`fas ${item.icon} w-4 text-center`}></i>
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
        /* Sign in and sign up buttons for non-authenticated users */
        <div className="flex items-center gap-2">
          <Link
            href="/auth/signIn"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-lg hover:scale-105"
          >
            <i className="fas fa-sign-in-alt text-sm"></i>
            <span className="hidden sm:inline">Sign In</span>
          </Link>
          <Link
            href="/auth/signUp"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:scale-105"
          >
            <i className="fas fa-user-plus text-sm"></i>
            <span className="hidden sm:inline">Sign Up</span>
          </Link>
        </div>
      )}
    </div>
  );
}
