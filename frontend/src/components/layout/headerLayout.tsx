import React, { useState } from "react";
import Link from 'next/link';
import Navbar from '../navigation/navbar';
import UserMenu from './userMenu';

interface HeaderLayoutProps {
  user?: { name?: string; email?: string };
  currentPath?: string;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = ({ user, currentPath }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <Link href={user ? '/app/dashboard' : '/'} className="flex flex-col leading-tight min-w-0">
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:underline truncate">
              Profolio
            </span>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              Your Personal Wealth OS
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <Navbar user={user} currentPath={currentPath} />
        </div>

        {/* Right side - User menu and mobile menu button */}
        <div className="flex items-center space-x-2">
          <UserMenu user={user} />
          
          {/* Mobile menu button */}
          {user && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 py-3">
            <Navbar 
              user={user} 
              currentPath={currentPath} 
              isMobile={true}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
};