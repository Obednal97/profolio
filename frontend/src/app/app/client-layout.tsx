// /app/app/client-layout.tsx (CLIENT component)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/unifiedAuth';
import { initializeDemoData } from '@/lib/demoData';

// DEVELOPMENT: Authentication imports commented out for testing
// import { useUser } from "@/lib/user";
// import type { User } from '@/types/global';
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// Error boundary component for debugging
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('🚨 Global error caught:', error);
      setHasError(true);
      setError(new Error(error.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      setHasError(true);
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-xl font-bold text-red-600 mb-4">⚠️ Error Detected</h1>
          <p className="text-gray-700 mb-4">An error occurred that prevented the page from loading:</p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono mb-4">
            {error?.message || 'Unknown error'}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
          <a 
            href="/test-mobile" 
            className="block w-full mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-center"
          >
            Go to Test Page
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Always call hooks at the top level (React Hooks rules)
  const authResult = useAuth();
  const { user, loading } = authResult;

  // Check if we're on the client side first
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is in demo mode (only on client)
  const isDemoMode = isClient && typeof localStorage !== 'undefined' && localStorage.getItem('demo-mode') === 'true';

  // Debug logging (only on client)
  useEffect(() => {
    if (isClient) {
      console.log('📱 ClientLayout Debug:', {
        isClient,
        hasUser: !!user,
        userId: user?.id,
        loading,
        isDemoMode,
        userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
        navigationMode: 'CLIENT_NAVIGATION'
      });
    }
  }, [isClient, user, loading, isDemoMode]);

  useEffect(() => {
    if (!isClient) return;

    try {
      // Initialize demo data if in demo mode
      if (isDemoMode) {
        console.log('🎭 Initializing demo data...');
        initializeDemoData();
      }
    } catch (demoError) {
      console.error('❌ Demo initialization error:', demoError);
      setError(`Demo initialization error: ${demoError instanceof Error ? demoError.message : 'Unknown error'}`);
    }
  }, [isDemoMode, isClient]);

  useEffect(() => {
    if (!isClient) return;

    try {
      // Only redirect if not loading and no user and not in demo mode
      if (!loading && !user && !isDemoMode) {
        console.log('🔄 Redirecting to sign-in (no auth found)');
        // Redirect to sign-in page where user can choose demo mode
        router.push('/auth/signIn');
      }
    } catch (redirectError) {
      console.error('❌ Redirect error:', redirectError);
      setError(`Navigation error: ${redirectError instanceof Error ? redirectError.message : 'Unknown error'}`);
    }
  }, [user, loading, isDemoMode, router, isClient]);

  // Show error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center border border-red-200">
          <div className="text-red-600 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Debug: Layout Error
          </h1>
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
          <div className="text-xs text-gray-500 mb-4">
            <strong>Debug Info:</strong><br/>
            Client: {isClient ? 'Yes' : 'No'}<br/>
            User Agent: {isClient ? navigator.userAgent : 'SSR'}<br/>
            Screen: {isClient ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'}
          </div>
          <div className="space-y-2">
            <button 
              onClick={() => setError(null)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <a 
              href="/test-mobile" 
              className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-center"
            >
              Go to Test Page
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking auth state OR while on server side
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#101828]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {!isClient ? 'Initializing...' : 'Loading...'}
          </p>
          {isClient && (
            <p className="text-xs text-gray-400 mt-2">
              Debug: Client={isClient ? 'Yes' : 'No'}, Loading={loading ? 'Yes' : 'No'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Don't render if no user and not in demo mode
  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-4">
            Redirecting to sign in...
          </p>
          <p className="text-xs text-gray-400">
            Debug: User={!!user ? 'Yes' : 'No'}, Demo={isDemoMode ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}