'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/lib/unifiedAuth';
import { AuthLayout } from "@/components/layout/authLayout";
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProfolioLogo from '@/components/ui/logo/ProfolioLogo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetUserPassword } = useAuth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      if (!resetUserPassword) {
        throw new Error("Password reset is not available in self-hosted mode");
      }
      await resetUserPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, resetUserPassword]);

  const handleResendEmail = useCallback(() => {
    setSuccess(false);
    setEmail('');
    setError(null);
  }, []);

  if (success) {
    return (
      <AuthLayout>
        <div className="w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform duration-200">
              <ProfolioLogo size="lg" />
            </Link>
            
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-2xl text-green-600 dark:text-green-400" aria-hidden="true"></i>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Check your email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Click the link in the email to reset your password. If you don&apos;t see the email, check your spam folder.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signIn"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <i className="fas fa-arrow-left mr-2" aria-hidden="true"></i>
                  Back to Sign In
                </Link>
                
                <button
                  onClick={handleResendEmail}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  type="button"
                >
                  <i className="fas fa-redo mr-2" aria-hidden="true"></i>
                  Send Another Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform duration-200">
            <ProfolioLogo size="lg" />
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Reset your password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
            role="alert"
          >
            <p className="text-red-600 dark:text-red-400 flex items-center text-sm">
              <i className="fas fa-exclamation-circle mr-2" aria-hidden="true"></i>
              {error}
            </p>
          </motion.div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="john@example.com"
                required
                disabled={loading}
                autoComplete="email"
                aria-describedby={error ? "email-error" : undefined}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" aria-hidden="true"></div>
                  Sending Reset Link...
                </div>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2" aria-hidden="true"></i>
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/auth/signIn"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
} 