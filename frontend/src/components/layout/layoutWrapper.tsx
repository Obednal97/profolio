"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { HeaderLayout as Header } from "@/components/layout/headerLayout";
import { FooterLayout as Footer } from "@/components/layout/footerLayout";
import DemoModeBanner from "@/components/layout/DemoModeBanner";
import { useAuth } from "@/lib/unifiedAuth";

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
  const [currency, setCurrencyState] = useState<string>('USD');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Safe auth hook usage - call unconditionally but handle errors
  const { user, userProfile } = useAuth();

  // Use ref to track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Debug localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 [Layout] localStorage debug:', {
        demoMode: localStorage.getItem('demo-mode'),
        userData: localStorage.getItem('user-data')
      });
    }
  }, []);
  
  // Use database user profile or demo user - memoized to prevent re-renders
  const currentUser = useMemo(() => {
    console.log('🔄 [Layout] Creating currentUser with:', {
      hasUser: !!user,
      hasUserProfile: !!userProfile,
      userProfileName: userProfile?.name,
      userDisplayName: user?.displayName,
      userEmail: user?.email,
      isDemoMode
    });
    
    if (user) {
      // Priority: database profile name > Firebase displayName > email username
      const name = userProfile?.name || user.displayName || user.email?.split('@')[0] || 'User';
      const result = {
        id: user.id,
        name: name,
        email: user.email || ''
      };
      console.log('✅ [Layout] Using user data with name:', result.name, 'from:', userProfile?.name ? 'database' : 'firebase');
      return result;
    } else if (isDemoMode) {
      // Check for stored demo user data
      const demoUser = {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@profolio.com'
      };
      
      if (typeof window !== 'undefined') {
        try {
          const storedUserData = localStorage.getItem('user-data');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            demoUser.name = parsedData.name || demoUser.name;
            demoUser.email = parsedData.email || demoUser.email;
            console.log('✅ [Layout] Using stored demo profile:', demoUser.name);
          } else {
            console.log('🎭 [Layout] Using default demo user');
          }
        } catch (error) {
          console.error('Error parsing demo user data:', error);
        }
      }
      
      return demoUser;
    }
    console.log('❌ [Layout] No user available');
    return null;
  }, [user?.id, user?.displayName, user?.email, userProfile?.name, isDemoMode]);

  // Cleanup function for abort controller
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Load user preferences from API when user is available - optimized with cleanup
  useEffect(() => {
    if (!mounted) return;

    const loadUserPreferences = async () => {
      if (currentUser?.id && !preferencesLoaded) {
        // Cancel any ongoing request
        cleanup();

        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const { apiCall } = await import('@/lib/mockApi');
          const response = await apiCall('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'GET_PROFILE', userId: currentUser.id }),
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;
          
          const data = await response.json();
          if (data.user?.preferences?.currency && !controller.signal.aborted) {
            setCurrencyState(data.user.preferences.currency);
            setPreferencesLoaded(true);
            return;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Request was aborted, this is expected
            return;
          }
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
  }, [currentUser?.id, preferencesLoaded, mounted, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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

  // Hide layout on auth pages and legacy paths
  const hideLayout = pathname.startsWith('/auth') || 
    ["/login", "/signup", "/signout"].some((path) => pathname.startsWith(path));
  
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
        {/* Demo Mode Banner - appears above header when in demo mode */}
        {isDemoMode && !hideLayout && <DemoModeBanner />}
        
        {!hideLayout && <Header user={headerUser} currentPath={pathname} />}
        <main className="relative z-10">
          {children}
        </main>
        {!hideLayout && <Footer />}
      </>
    </AppContext.Provider>
  );
}