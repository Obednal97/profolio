"use client";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/authLayout";
import Link from 'next/link';
import { motion } from 'framer-motion';

function SignOut() {
  const { signOut } = useAuth();
  const { data: user } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      if (!user) {
        window.location.href = "/";
        return;
      }
      try {
        await signOut({
          callbackUrl: "/",
          redirect: true,
        });
      } catch (err) {
        console.error("Logout error:", err);
        setError("Failed to sign out. Please try again.");
      }
    };

    if (!user) {
      window.location.href = "/";
      return;
    }

    if (user) {
      handleLogout();
    }
  }, [user, signOut]);

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-exclamation-triangle text-2xl text-red-600 dark:text-red-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Error Signing Out
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <Link
                href="/app/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Return to Dashboard
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <div className="animate-spin h-8 w-8 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Signing Out
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we sign you out securely...
              </p>
              <div className="flex justify-center gap-2 pt-4">
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignOut;