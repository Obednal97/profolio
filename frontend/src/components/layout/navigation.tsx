import { useState } from 'react';
import Link from 'next/link';

interface NavigationProps {
  user?: {
    name?: string;
    email?: string;
  };
  unreadNotifications?: number;
  currentPath?: string;
}

export default function Navbar({
  user,
  unreadNotifications = 0,
  currentPath = "/",
}: NavigationProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigationLinks = [
    { path: "/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
    { path: "/assetManager", label: "Assets", icon: "fa-wallet" },
    { path: "/propertyManager", label: "Properties", icon: "fa-home" },
    { path: "/expenseManager", label: "Expenses", icon: "fa-receipt" },
  ];

  const profileMenuItems = [
    { label: "Account Settings", path: "/account/settings", icon: "fa-cog" },
    { label: "Notifications", path: "/notifications", icon: "fa-bell" },
    { label: "Sign Out", path: "/account/logout", icon: "fa-sign-out-alt" },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-white/10">
      <Link href="/" className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
        WealthTracker
      </Link>
      <div className="hidden md:flex items-center space-x-4">
        {navigationLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPath === link.path
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className={`fas ${link.icon} mr-2`}></i>
            {link.label}
          </Link>
        ))}
        <button
          className="relative p-2 text-white/60 hover:text-white transition-colors"
          onClick={() => window.location.href = "/notifications"}
        >
          <i className="fas fa-bell text-lg"></i>
          {unreadNotifications > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-green-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-medium">
              {user?.name?.charAt(0) || "?"}
            </div>
            <span>{user?.name}</span>
            <i className="fas fa-chevron-down text-xs"></i>
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-xl border border-white/10 shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-white/60">{user?.email}</p>
              </div>
              {profileMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="block px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <i className={`fas ${item.icon} mr-2`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}