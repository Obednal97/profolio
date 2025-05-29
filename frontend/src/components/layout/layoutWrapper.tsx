"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import { useAuth } from "@/lib/auth";

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
  const { user } = useAuth(); // Use Firebase authentication
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currency, setCurrencyState] = useState<string>('USD');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  const demoUser = isDemoMode ? {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@profolio.com'
  } : null;

  // Use Firebase user or demo user
  const currentUser = user ? {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || ''
  } : demoUser;

  // Load user preferences from API when user is available
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (currentUser?.id && !preferencesLoaded) {
        try {
          const { apiCall } = await import('@/lib/mockApi');
          const response = await apiCall('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'GET_PROFILE', userId: currentUser.id }),
          });
          
          const data = await response.json();
          if (data.user?.preferences) {
            const prefs = data.user.preferences;
            if (prefs.currency) setCurrencyState(prefs.currency);
            if (prefs.theme) setTheme(prefs.theme === 'system' ? 'dark' : prefs.theme);
            setPreferencesLoaded(true);
            return; // Don't load from localStorage if we have user preferences
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      }
      
      // Fallback to localStorage if no user or failed to load user preferences
      if (!preferencesLoaded) {
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
        setPreferencesLoaded(true);
      }
    };

    loadUserPreferences();
  }, [currentUser?.id, preferencesLoaded]);

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

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    
    // Save to localStorage as backup
    localStorage.setItem('currency', newCurrency);
    
    // Save to user preferences if user is logged in
    if (currentUser?.id) {
      try {
        const { apiCall } = await import('@/lib/mockApi');
        await apiCall('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            method: 'UPDATE_PREFERENCES', 
            userId: currentUser.id,
            preferences: { currency: newCurrency }
          }),
        });
      } catch (error) {
        console.error('Failed to save currency preference:', error);
      }
    }
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
  
  // For app section, show current user (Firebase or demo)
  // For public pages, show no user
  const headerUser = isAppSection && currentUser ? currentUser : undefined;

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