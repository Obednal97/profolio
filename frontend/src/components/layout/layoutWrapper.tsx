"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import { useUser } from "@/lib/user";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// App context for theme and currency
interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// For backward compatibility
export const useTheme = () => {
  const context = useAppContext();
  return {
    theme: context.theme,
    toggleTheme: context.toggleTheme,
  };
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { data: user } = useUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currency, setCurrencyState] = useState<string>('USD');

  // Load theme and currency from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
    
    setCurrencyState(savedCurrency);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save currency to localStorage
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  const formatCurrency = (amount: number) => {
    // Convert cents to currency units if amount is large (assuming it's in cents)
    const value = amount > 1000 ? amount / 100 : amount;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
    }).format(value);
  };

  const appValue = {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    formatCurrency,
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
    <AppContext.Provider value={appValue}>
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-900 text-white' 
          : 'bg-white text-gray-900'
      }`}>
        {!hideLayout && <Header user={headerUser} currentPath={pathname} />}
        <main className="relative z-10">
          {children}
        </main>
        {!hideLayout && <Footer />}
      </div>
    </AppContext.Provider>
  );
}