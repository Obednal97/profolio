import { useCallback } from 'react';
import Link from 'next/link';

interface NavigationProps {
  user?: {
    name?: string;
    email?: string;
  };
  unreadNotifications?: number;
  currentPath?: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function Navbar({
  user,
  currentPath = "/",
  isMobile = false,
  onNavigate,
}: NavigationProps) {
  const navigationLinks = user
    ? [
        { path: "/app/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
        { path: "/app/assetManager", label: "Assets", icon: "fa-wallet" },
        { path: "/app/propertyManager", label: "Properties", icon: "fa-home" },
        { path: "/app/expenseManager", label: "Expenses", icon: "fa-receipt" },
      ]
    : [
        { path: "/about", label: "About", icon: "fa-info-circle" },
        { path: "/how-it-works", label: "How it works", icon: "fa-lightbulb" },
        { path: "/pricing", label: "Pricing", icon: "fa-tags" },
      ];

  // Memoize click handler for performance
  const handleLinkClick = useCallback(() => {
    if (onNavigate) {
      onNavigate();
    }
  }, [onNavigate]);

  if (isMobile) {
    return (
      <nav className="flex flex-col space-y-1">
        {navigationLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            onClick={handleLinkClick}
            className={`px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3 transition-all duration-200 touch-manipulation ${
              currentPath === link.path
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60"
            }`}
          >
            <i className={`fas ${link.icon} text-lg`}></i>
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-1">
      {navigationLinks.map((link) => (
        <Link
          key={link.path}
          href={link.path}
          onClick={handleLinkClick}
          className={`px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200 relative ${
            currentPath === link.path
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
              : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 hover:scale-105"
          }`}
        >
          <i className={`fas ${link.icon}`}></i>
          <span className="hidden lg:inline">{link.label}</span>
          
          {/* Active indicator */}
          {currentPath === link.path && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
          )}
        </Link>
      ))}
    </nav>
  );
}