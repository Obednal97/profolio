// /app/app/client-layout.tsx (CLIENT component)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/unifiedAuth';
import { initializeDemoData } from '@/lib/demoData';
import { AuthLoadingState } from '@/components/ui/AuthLoadingState';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [authFlow, setAuthFlow] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
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

  useEffect(() => {
    if (!isClient) return;

    try {
      // Initialize demo data if in demo mode
      if (isDemoMode) {
        initializeDemoData();
      }
    } catch (demoError) {
      console.error('Demo initialization error:', demoError);
      setError(`Demo initialization error: ${demoError instanceof Error ? demoError.message : 'Unknown error'}`);
    }
  }, [isDemoMode, isClient]);

  useEffect(() => {
    if (!isClient) return;

    try {
      // Check if we're coming from a Google auth redirect
      const urlParams = new URLSearchParams(window.location.search);
      const isAuthRedirect = urlParams.has('auth-action') || 
                             window.location.pathname.includes('/__/auth/');

      // Determine authentication flow state - optimized for instant navigation
      if (loading || isAuthRedirect) {
        setAuthFlow('loading');
      } else if ((user && user.id) || isDemoMode) {
        // Authenticated - show content immediately
        setAuthFlow('authenticated');
        
        // Clean up any lingering auth-action parameters without delay
        if (urlParams.has('auth-action')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('auth-action');
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        // Add a small delay before redirecting to avoid race conditions
        const redirectTimer = setTimeout(() => {
          setAuthFlow('unauthenticated');
          // Redirect to sign-in page where user can choose demo mode
          router.push('/auth/signIn');
        }, 500);
        
        return () => clearTimeout(redirectTimer);
      }
    } catch (redirectError) {
      console.error('Redirect error:', redirectError);
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
            Application Error
          </h1>
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => setError(null)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle different authentication flow states
  switch (authFlow) {
    case 'loading':
      // Only show loading state for initial app load, not for auth transitions
      return <AuthLoadingState type="loading" message="Initializing application..." />;
      
    case 'unauthenticated':
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          {/* Animated background blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-40 left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-20 dark:opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
          </div>
          
          <div className="relative z-10 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/50 max-w-md w-full">
            <div className="text-6xl mb-6">
              <i className="fas fa-lock text-blue-500 dark:text-blue-400"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Authentication Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please sign in to access your portfolio dashboard
            </p>
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to sign in...
            </p>
          </div>
        </div>
      );
      
    case 'authenticated':
    default:
      return <>{children}</>;
  }
}