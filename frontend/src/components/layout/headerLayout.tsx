import React from "react";
import Link from 'next/link';
import Navbar from '../navigation/navbar';
import UserMenu from './userMenu';

interface HeaderLayoutProps {
  user?: { name?: string; email?: string };
  currentPath?: string;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = ({ user, currentPath }) => {
  return (
    <header>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
        <div className="flex items-center space-x-4">
          <Link href={user ? '/app/dashboard' : '/'} className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-gray-900 dark:text-white hover:underline">Profolio</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Your Personal Wealth OS</span>
          </Link>
        </div>
        <Navbar user={user} currentPath={currentPath} />
        <UserMenu user={user} />
      </div>
    </header>
  );
};