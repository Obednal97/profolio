'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkStatusProps {
  showWhenOnline?: boolean;
  className?: string;
  position?: 'top' | 'bottom';
  persistent?: boolean;
}

export function NetworkStatus({ 
  showWhenOnline = false, 
  className = '',
  position = 'top',
  persistent = false
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [hasBeenOffline, setHasBeenOffline] = useState<boolean>(false);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (hasBeenOffline) {
        setShowStatus(true);
        // Auto-hide online status after 3 seconds (unless persistent)
        if (!persistent) {
          setTimeout(() => setShowStatus(false), 3000);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasBeenOffline(true);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show status initially if offline
    if (!navigator.onLine) {
      setShowStatus(true);
      setHasBeenOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasBeenOffline, persistent]);

  // Determine if we should show the status
  const shouldShow = persistent || showStatus || (!isOnline) || (showWhenOnline && isOnline);

  if (!shouldShow) return null;

  const positionClasses = {
    top: 'top-4 left-1/2 transform -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.3
          }}
          className={`fixed ${positionClasses[position]} z-[60] ${className}`}
        >
          <div className={`
            inline-flex items-center gap-3 px-4 py-2 rounded-full shadow-lg backdrop-blur-md
            ${isOnline 
              ? 'bg-green-500/90 text-white border border-green-400/50' 
              : 'bg-red-500/90 text-white border border-red-400/50'
            }
          `}>
            {/* Status Icon */}
            <motion.div
              animate={isOnline ? { scale: [1, 1.1, 1] } : { 
                opacity: [1, 0.5, 1],
                scale: [1, 0.95, 1]
              }}
              transition={isOnline ? { 
                duration: 0.6, 
                ease: "easeInOut" 
              } : { 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              {isOnline ? (
                <i className="fas fa-wifi text-lg"></i>
              ) : (
                <i className="fas fa-wifi-slash text-lg"></i>
              )}
            </motion.div>

            {/* Status Text */}
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {isOnline ? 'Back Online' : 'No Connection'}
              </span>
              {!isOnline && (
                <span className="text-xs opacity-90">
                  Cached data available
                </span>
              )}
            </div>

            {/* Close Button (only for persistent mode) */}
            {persistent && (
              <button
                onClick={() => setShowStatus(false)}
                className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface NetworkStatusHookReturn {
  isOnline: boolean;
  showOfflineMessage: () => void;
  hasConnection: boolean;
}

/**
 * Hook for network status management
 * @returns Network status utilities
 */
export function useNetworkStatus(): NetworkStatusHookReturn {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasConnection, setHasConnection] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setHasConnection(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setHasConnection(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasConnection(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showOfflineMessage = () => {
    // Could trigger a toast notification or modal
    console.log('🚫 This feature requires an internet connection');
  };

  return {
    isOnline,
    showOfflineMessage,
    hasConnection
  };
}

/**
 * Higher-order component for wrapping components with network status
 */
export function withNetworkStatus<T extends object>(
  Component: React.ComponentType<T>
) {
  return function NetworkStatusWrapper(props: T) {
    const networkStatus = useNetworkStatus();
    
    return (
      <>
        <NetworkStatus />
        <Component {...props} networkStatus={networkStatus} />
      </>
    );
  };
}

export default NetworkStatus; 