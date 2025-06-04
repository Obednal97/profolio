'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Wait a moment then redirect to intended page or home
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/favicon.ico', { 
        cache: 'no-cache',
        method: 'HEAD'
      });
      
      if (response.ok) {
        // Connection restored
        setIsOnline(true);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch {
      // Still offline
      console.log('Still offline, retry failed');
    }
  };

  const handleGoHome = () => {
    // Try to navigate to cached home page
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
        >
          {/* Connection Status Indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isOnline 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            {isOnline ? (
              <motion.i 
                className="fas fa-wifi text-3xl text-green-500"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              />
            ) : (
              <motion.i 
                className="fas fa-wifi-slash text-3xl text-red-500"
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 0.95, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>

          {/* Status Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            {isOnline ? (
              <div>
                <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  <i className="fas fa-check-circle mr-2"></i>
                  Connection Restored!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Redirecting you back to Profolio...
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Internet Connection
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Don&apos;t worry! Your portfolio data is safely stored locally. 
                  You can continue viewing your cached data while offline.
                </p>
                
                {retryCount > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Retry attempts: {retryCount}
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            {!isOnline && (
              <>
                <button
                  onClick={handleRetry}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-sync-alt"></i>
                  Try Again
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-home"></i>
                  Go to Cached Home
                </button>
              </>
            )}
          </motion.div>

          {/* Offline Features Available */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Available Offline:
              </h3>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                <li><i className="fas fa-check text-green-500 mr-2"></i>View cached portfolio data</li>
                <li><i className="fas fa-check text-green-500 mr-2"></i>Browse previously loaded pages</li>
                <li><i className="fas fa-check text-green-500 mr-2"></i>Access offline documentation</li>
                <li><i className="fas fa-times text-red-500 mr-2"></i>Real-time data updates</li>
                <li><i className="fas fa-times text-red-500 mr-2"></i>New data synchronization</li>
              </ul>
            </motion.div>
          )}

          {/* Profolio Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              <strong className="text-blue-600 dark:text-blue-400">Profolio</strong> - 
              Your portfolio manager works offline too
            </div>
          </motion.div>
        </motion.div>

        {/* Network Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4 text-center"
        >
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isOnline 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 