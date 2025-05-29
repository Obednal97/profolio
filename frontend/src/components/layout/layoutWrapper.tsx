"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import { useAuth } from "@/lib/auth";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// App context for currency only (theme is handled by theme-provider)
interface AppContextType {
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

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<string>('USD');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user or demo user - memoized to prevent re-renders
  const currentUser = useMemo(() => {
    if (user) {
      return {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || ''
      };
    } else if (isDemoMode) {
      return {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@profolio.com'
      };
    }
    return null;
  }, [user, isDemoMode]);

  // Load user preferences from API when user is available
  useEffect(() => {
    if (!mounted) return;

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
          if (data.user?.preferences?.currency) {
            setCurrencyState(data.user.preferences.currency);
            setPreferencesLoaded(true);
            return;
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      }
      
      // Fallback to localStorage if no user or failed to load user preferences
      if (!preferencesLoaded) {
        const savedCurrency = localStorage.getItem('currency') || 'USD';
        setCurrencyState(savedCurrency);
        setPreferencesLoaded(true);
      }
    };

    loadUserPreferences();
  }, [currentUser?.id, preferencesLoaded, mounted]);

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    
    // Save to localStorage as backup
    if (mounted) {
      localStorage.setItem('currency', newCurrency);
    }
    
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

  // Don't render layout until mounted to prevent hydration issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AppContext.Provider value={appValue}>
      <>
        {!hideLayout && <Header user={headerUser} currentPath={pathname} />}
        <main className="relative z-10">
          {children}
        </main>
        {!hideLayout && <Footer />}
      </>
    </AppContext.Provider>
  );
}