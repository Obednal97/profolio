"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "../layout/layoutWrapper";

interface UserMenuProps {
  user?: {
    name?: string;
    email?: string;
  };
  unreadNotifications?: number;
}

export default function UserMenu({
  user,
  unreadNotifications = 0,
}: UserMenuProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const profileMenuItems = [
    { label: "Account Settings", path: "/app/settings", icon: "fa-cog" },
    { label: "Notifications", path: "/app/notifications", icon: "fa-bell" },
    { label: "Sign Out", path: "/auth/signOut", icon: "fa-sign-out-alt" },
  ];

  const getThemeIcon = () => {
    return theme === "light" ? "fa-moon" : "fa-sun";
  };

  const getThemeTooltip = () => {
    return theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-sm"
        title={getThemeTooltip()}
      >
        <i className={`fas ${getThemeIcon()} text-lg`}></i>
      </button>

      {user ? (
        <>
          <button
            className="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            onClick={() => (window.location.href = "/notifications")}
            title="Notifications"
          >
            <i className="fas fa-bell text-lg"></i>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || "?"}
              </div>
              <span className="hidden sm:inline">{user?.name}</span>
              <i className="fas fa-chevron-down text-xs"></i>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                {profileMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <i className={`fas ${item.icon} mr-2`}></i>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <Link
            href="/auth/signIn"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Log In
          </Link>
          <Link
            href="/auth/signUp"
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
          >
            Sign Up
          </Link>
        </>
      )}
    </div>
  );
}
