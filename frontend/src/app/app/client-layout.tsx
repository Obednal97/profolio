// /app/app/client-layout.tsx (CLIENT component)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/unifiedAuth';
import { initializeDemoData } from '@/lib/demoData';

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
      // Only redirect if not loading and no user and not in demo mode
      if (!loading && !user && !isDemoMode) {
        // Redirect to sign-in page where user can choose demo mode
        router.push('/auth/signIn');
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

  // Show loading while checking auth state OR while on server side
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#101828]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {!isClient ? 'Initializing...' : 'Loading...'}
          </p>
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
        </div>
      </div>
    );
  }

  return <>{children}</>;
}