import React, { useState, useCallback } from "react";
import Link from 'next/link';
import Navbar from '../navigation/navbar';
import UserMenu from './userMenu';

interface HeaderLayoutProps {
  user?: { name?: string; email?: string };
  currentPath?: string;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = React.memo(({ user, currentPath }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Memoize toggle handler for performance
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Memoize close handler for performance
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Glass header with seamless transparency gradient */}
      <div className="relative">
        {/* Gradient blur layers - strongest to weakest */}
        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-b from-white/40 via-white/20 to-transparent dark:from-gray-900/50 dark:via-gray-900/25 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)'}}></div>
        <div className="absolute inset-0 backdrop-blur-lg bg-gradient-to-b from-white/30 via-white/15 to-transparent dark:from-gray-900/40 dark:via-gray-900/20 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 20%, black 50%, transparent 100%)'}}></div>
        <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-b from-white/20 via-white/10 to-transparent dark:from-gray-900/30 dark:via-gray-900/15 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 40%, black 70%, transparent 100%)'}}></div>
        <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-white/10 to-transparent dark:from-gray-900/20 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'}}></div>
        
        {/* Content */}
        <div className="relative flex items-center px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo with enhanced typography */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Link href={user ? '/app/dashboard' : '/'} className="group flex items-center space-x-3 min-w-0">
              {/* Logo icon with subtle glow */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:shadow-blue-500/20 transition-all duration-300">
                <i className="fas fa-chart-pie text-white text-lg"></i>
              </div>
              
              {/* Logo text */}
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

          {/* Desktop Navigation - Centered with subtle glass */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-full px-2 py-1 border border-white/20 dark:border-white/10 shadow-sm">
              <Navbar user={user} currentPath={currentPath} />
            </div>
          </div>

          {/* Right side - User menu and mobile menu button */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <UserMenu user={user} />
            
            {/* Mobile menu button with subtle glass */}
            {user && (
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2.5 rounded-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-200 shadow-sm"
                aria-label="Toggle mobile menu"
              >
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation with gradient blur layers */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden relative">
          {/* Mobile gradient blur layers - strongest to weakest */}
          <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-b from-white/45 via-white/25 to-transparent dark:from-gray-900/55 dark:via-gray-900/30 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)'}}></div>
          <div className="absolute inset-0 backdrop-blur-lg bg-gradient-to-b from-white/35 via-white/18 to-transparent dark:from-gray-900/45 dark:via-gray-900/23 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 20%, black 50%, transparent 100%)'}}></div>
          <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-b from-white/25 via-white/12 to-transparent dark:from-gray-900/35 dark:via-gray-900/18 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 40%, black 70%, transparent 100%)'}}></div>
          <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-white/15 to-transparent dark:from-gray-900/25 dark:to-transparent" style={{maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'}}></div>
          
          {/* Content */}
          <div className="relative px-4 py-4">
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-sm">
              <Navbar 
                user={user} 
                currentPath={currentPath} 
                isMobile={true}
                onNavigate={closeMobileMenu}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

HeaderLayout.displayName = 'HeaderLayout';