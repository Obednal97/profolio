import React from "react";
import Navbar from '../navigation/navbar';
import UserMenu from './userMenu';

interface HeaderLayoutProps {
  user?: { name?: string; email?: string };
  currentPath?: string;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = ({ user, currentPath }) => {
  return (
    <header>
      <div className="flex items-center justify-between">
        {/* Left: Logo and title */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-foreground">Profolio</span>
            <span className="text-sm text-muted-foreground">Your Personal Wealth OS</span>
          </div>
        </div>
        <Navbar user={user} currentPath={currentPath} />
        <UserMenu user={user} />
      </div>
    </header>
  );
};