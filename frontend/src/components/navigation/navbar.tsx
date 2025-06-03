import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const navigationLinks = useMemo(() => {
    return user
      ? [
          { path: "/app/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
          { path: "/app/assetManager", label: "Assets", icon: "fa-wallet" },
          { path: "/app/propertyManager", label: "Properties", icon: "fa-home" },
          { path: "/app/expenseManager", label: "Expenses", icon: "fa-receipt" },
        ]
      : [
          { path: "/", label: "Home", icon: "fa-home" },
          { path: "/about", label: "About", icon: "fa-info-circle" },
          { path: "/how-it-works", label: "How it works", icon: "fa-lightbulb" },
          { path: "/pricing", label: "Pricing", icon: "fa-tags" },
        ];
  }, [user]);

  // Update indicator position when currentPath changes
  useEffect(() => {
    if (isMobile || !navRef.current) return;

    const updateIndicatorPosition = () => {
      const activeIndex = navigationLinks.findIndex(link => link.path === currentPath);
      if (activeIndex !== -1 && linksRef.current[activeIndex]) {
        const activeLink = linksRef.current[activeIndex];
        if (activeLink) {
          const navRect = navRef.current!.getBoundingClientRect();
          const linkRect = activeLink.getBoundingClientRect();
          
          setIndicatorStyle({
            left: linkRect.left - navRect.left,
            width: linkRect.width,
          });
        }
      }
    };

    // Small delay to ensure DOM has settled
    const timer = setTimeout(updateIndicatorPosition, 50);
    
    // Add resize listener
    window.addEventListener('resize', updateIndicatorPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicatorPosition);
    };
  }, [currentPath, navigationLinks, isMobile]);

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
    <nav ref={navRef} className="flex items-center space-x-3 relative">
      {/* Sliding background indicator */}
      <div
        className="absolute bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg pointer-events-none"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          height: '100%',
          top: 0,
          zIndex: 0,
          transition: 'all 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      />
      
      {navigationLinks.map((link, index) => (
        <Link
          key={link.path}
          ref={(el) => { linksRef.current[index] = el; }}
          href={link.path}
          onClick={handleLinkClick}
          className={`px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 ease-out relative z-10 ${
            currentPath === link.path
              ? "text-white"
              : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:scale-105"
          }`}
        >
          <i className={`fas ${link.icon}`}></i>
          <span className="hidden lg:inline">{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}