import React from "react";
import Link from "next/link";
import Navbar from "../navigation/navbar";
import UserMenu from "./userMenu";
import ProfolioLogo from "../ui/logo/ProfolioLogo";

interface HeaderLayoutProps {
  user?: { name?: string; email?: string };
  currentPath?: string;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = React.memo(
  ({ user, currentPath }) => {
    return (
      <header className="sticky top-0 z-50 pwa-header">
        {/* Glass header with seamless transparency gradient */}
        <div className="relative pwa-header-background">
          {/* Gradient blur layers - strongest to weakest */}
          <div
            className="absolute inset-0 backdrop-blur-xl bg-gradient-to-b from-white/40 via-white/20 to-transparent dark:from-gray-900/50 dark:via-gray-900/25 dark:to-transparent"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
              transform: "translateZ(0)",
              willChange: "backdrop-filter",
            }}
          />
          <div
            className="absolute inset-0 backdrop-blur-lg bg-gradient-to-b from-white/30 via-white/15 to-transparent dark:from-gray-900/40 dark:via-gray-900/20 dark:to-transparent"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 20%, black 50%, transparent 100%)",
              transform: "translateZ(0)",
              willChange: "backdrop-filter",
            }}
          />
          <div
            className="absolute inset-0 backdrop-blur-md bg-gradient-to-b from-white/20 via-white/10 to-transparent dark:from-gray-900/30 dark:via-gray-900/15 dark:to-transparent"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 40%, black 70%, transparent 100%)",
              transform: "translateZ(0)",
              willChange: "backdrop-filter",
            }}
          />
          <div
            className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-white/10 to-transparent dark:from-gray-900/20 dark:to-transparent"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 60%, transparent 100%)",
              transform: "translateZ(0)",
              willChange: "backdrop-filter",
            }}
          />

          {/* Content - Flexible layout that adapts to content needs */}
          <div
            className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-4"
            style={{
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          >
            {/* Logo - Fixed width, no flex growth */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 shrink-0">
              <Link
                href={user ? "/app/dashboard" : "/"}
                className="group flex items-center space-x-3 min-w-0"
              >
                {/* Logo icon with subtle glow */}
                <ProfolioLogo size="md" />

                {/* Logo text - always visible but responsive sizing */}
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 truncate">
                    Profolio
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium hidden sm:block">
                    Personal Wealth OS
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Flexible center section that grows as needed */}
            <div className="hidden md:flex flex-grow justify-center min-w-0">
              <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-full px-2 py-1 border border-white/20 dark:border-white/10 shadow-sm max-w-full">
                <Navbar user={user} currentPath={currentPath} />
              </div>
            </div>

            {/* Right side - User menu with fixed width */}
            <div className="flex items-center space-x-3 shrink-0">
              <UserMenu user={user} />
            </div>
          </div>
        </div>
      </header>
    );
  }
);

HeaderLayout.displayName = "HeaderLayout";
