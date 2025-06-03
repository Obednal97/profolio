"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';

interface MobileBottomNavProps {
  user?: {
    name?: string;
    email?: string;
  };
  currentPath?: string;
}

export default function MobileBottomNav({
  user,
  currentPath = "/",
}: MobileBottomNavProps) {
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
    if (!navRef.current) return;

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

    // Update position on window resize
    const handleResize = () => updateIndicatorPosition();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentPath, navigationLinks]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background with seamless transparency gradient - multiple layers for depth */}
      <div className="relative">
        {/* Gradient blur layers - strongest to weakest, from bottom to top */}
        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-t from-white/40 via-white/20 to-transparent dark:from-gray-900/50 dark:via-gray-900/25 dark:to-transparent" style={{maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)'}}></div>
        <div className="absolute inset-0 backdrop-blur-lg bg-gradient-to-t from-white/30 via-white/15 to-transparent dark:from-gray-900/40 dark:via-gray-900/20 dark:to-transparent" style={{maskImage: 'linear-gradient(to top, black 20%, black 50%, transparent 100%)'}}></div>
        <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-t from-white/20 via-white/10 to-transparent dark:from-gray-900/30 dark:via-gray-900/15 dark:to-transparent" style={{maskImage: 'linear-gradient(to top, black 40%, black 70%, transparent 100%)'}}></div>
        <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-t from-white/10 to-transparent dark:from-gray-900/20 dark:to-transparent" style={{maskImage: 'linear-gradient(to top, black 60%, transparent 100%)'}}></div>
        
        {/* Subtle border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10"></div>
        
        {/* Navigation content */}
        <nav ref={navRef} className="relative flex items-center justify-around px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          {/* Sliding background indicator */}
          <div
            className="absolute bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg pointer-events-none"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              height: '48px', // Match the h-12 of navigation links
              top: '12px', // py-3 offset
              zIndex: 0,
              transition: 'all 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          />
          
          {navigationLinks.map((link, index) => (
            <Link
              key={link.path}
              ref={(el) => { linksRef.current[index] = el; }}
              href={link.path}
              className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 touch-manipulation ${
                currentPath === link.path
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title={link.label}
              aria-label={link.label}
            >
              <i className={`fas ${link.icon} text-xl`}></i>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
} 