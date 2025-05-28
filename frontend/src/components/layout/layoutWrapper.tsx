"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import { useUser } from "@/lib/user";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Theme context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { data: user } = useUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const themeValue = {
    theme,
    toggleTheme,
  };

  const hideLayout = ["/login", "/signup", "/signout"].some((path) =>
    pathname.startsWith(path)
  );
  
  // Check if we're in the app section
  const isAppSection = pathname.startsWith("/app");
  
  // For app section, always show app navigation (with mock user if needed)
  // For public pages, show public navigation
  const headerUser = isAppSection ? (user || { name: "Demo User", email: "demo@example.com" }) : undefined;

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
      }`}>
        {!hideLayout && <Header user={headerUser} currentPath={pathname} />}
        <main className="relative z-10">
          {children}
        </main>
        {!hideLayout && <Footer />}
      </div>
    </ThemeContext.Provider>
  );
}