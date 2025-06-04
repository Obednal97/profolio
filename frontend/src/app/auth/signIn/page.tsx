'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/unifiedAuth';
import { useAuth as useAuthHook } from '@/hooks/useAuth';
import { AuthLayout } from "@/components/layout/authLayout";
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProfolioLogo from '@/components/ui/logo/ProfolioLogo';

function SignInPage() {
  const { user, loading: authLoading, signIn, signInWithGoogleProvider, authMode, config } = useAuth();
  const { signInWithDemo } = useAuthHook();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(authMode === 'local'); // Expanded by default in self-hosted mode

  const isFormValid = formData.email.trim() !== '' && formData.password.trim() !== '';

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';

  // Redirect if already authenticated (unified user or demo mode)
  useEffect(() => {
    console.log('Auth state check:', { user: user?.id, authLoading, isDemoMode, authMode });
    
    // Only redirect if we have a valid user AND we're not in a loading state
    if (!authLoading && ((user && user.id) || isDemoMode)) {
      console.log('Redirecting to dashboard...');
      
      // Use a small delay to ensure the auth state is fully settled
      const redirectTimer = setTimeout(() => {
        window.location.href = '/app/dashboard';
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, authLoading, isDemoMode, authMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(formData.email, formData.password);
      // Redirect with signing in indicator
      window.location.href = '/app/dashboard?auth-action=signing-in';
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInWithGoogleProvider) {
      setError('Google sign-in is not available');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signInWithGoogleProvider();
      console.log('Google sign-in successful:', result);
      
      // Primary redirect attempt with signing in indicator
      window.location.href = '/app/dashboard?auth-action=signing-in';
      
      // Fallback redirect in case the primary one doesn't work
      setTimeout(() => {
        if (window.location.pathname === '/auth/signIn') {
          console.log('Fallback redirect triggered');
          window.location.replace('/app/dashboard?auth-action=signing-in');
        }
      }, 1000);
      
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setError(null);
    setDemoLoading(true);

    try {
      await signInWithDemo({
        callbackUrl: "/app/dashboard?auth-action=signing-in",
        redirect: true,
      });
    } catch (err) {
      console.error("Demo mode error:", err);
      setError("Failed to start demo mode. Please try again.");
      setDemoLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </AuthLayout>
    );
  }

  // Don't render if user is already authenticated or in demo mode
  if (!authLoading && ((user && user.id) || isDemoMode)) return null;

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="text-center mb-8">
          {/* Clickable Logo */}
          <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform duration-200">
            <ProfolioLogo size="lg" />
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
          {authMode && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {authMode === 'local' ? '🏠 Self-hosted mode' : '☁️ Cloud mode'}
            </p>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
          >
            <p className="text-red-600 dark:text-red-400 flex items-center text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </motion.div>
        )}

        {/* Demo Mode Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-play-circle text-blue-600 dark:text-blue-400 mr-3 text-xl"></i>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Try Demo Mode</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Explore all features with sample data - no account needed
                </p>
              </div>
            </div>
            <button
              onClick={handleDemoMode}
              disabled={demoLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {demoLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Starting...
                </div>
              ) : (
                "Try Demo"
              )}
            </button>
          </div>
        </motion.div>

        {/* Google Sign-in (show first in Firebase mode) */}
        {config?.enableGoogleAuth && signInWithGoogleProvider && (
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* Divider (only show when both Google and email are available) */}
        {config?.enableGoogleAuth && signInWithGoogleProvider && (
          <div className="mb-6">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-transparent">Or continue with</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
          </div>
        )}

        {/* Email sign-in - collapsible in cloud mode, expanded in self-hosted mode */}
        {authMode === 'local' ? (
          // Self-hosted mode - always show email form
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        ) : (
          // Cloud mode - collapsible email form
          <div>
            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-envelope mr-2"></i>
                Sign in with Email
                <i className="fas fa-chevron-down ml-2"></i>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sign in with Email</span>
                    <button
                      onClick={() => setShowEmailForm(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="mt-8 text-center space-y-4">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Don&apos;t have an account? </span>
            <Link href="/auth/signUp" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign up
            </Link>
          </div>
          
          {/* Only show forgot password for Firebase mode */}
          {config?.enableGoogleAuth && (
            <div>
              <Link href="/auth/forgotPassword" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Forgot your password?
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignInPage;