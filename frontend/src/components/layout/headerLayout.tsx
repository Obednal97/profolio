import React from "react";
import Navbar from '../navigation/navbar';
import UserMenu from './userMenu';

interface HeaderLayoutProps {
  user?: { name?: string; email?: string };
  currentPath?: string;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = ({ user, currentPath }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-foreground">Profolio</span>
            <span className="text-sm text-muted-foreground">Your Personal Wealth OS</span>
          </div>
        </div>
        <Navbar user={user} currentPath={currentPath} />
      </div>
      <div className="mt-4 md:mt-0 md:ml-auto">
        <UserMenu user={user} />
      </div>
    </header>
  );
};