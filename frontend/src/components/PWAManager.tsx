'use client';

import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { Button } from '@/components/ui/button/button';
import { X, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface ServiceWorkerRegistrationWithUpdate extends ServiceWorkerRegistration {
  updatefound?: () => void;
}

/**
 * PWAManager Component
 * 
 * Handles Progressive Web App functionality including:
 * - Service worker registration and updates
 * - Install prompt management (popup banner)
 * - Standalone app detection
 * 
 * Optimized for performance with proper cleanup and resource management
 */
const PWAManager = memo(() => {
  // PWA installation logic from custom hook
  const { canInstall, showInstallPrompt: triggerInstall, isInstalling } = usePWAInstall();
  
  // State for popup banner display
  const [showBanner, setShowBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Refs for cleanup management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistrationWithUpdate | null>(null);

  // Memoized session storage check (client-side only)
  const isBannerDismissed = useCallback(() => {
    if (!isClient) return false;
    try {
      return sessionStorage.getItem('pwa-prompt-dismissed') === 'true';
    } catch {
      return false;
    }
  }, [isClient]);

  // Service worker registration with proper error handling
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });
      
      registrationRef.current = registration;
      
      // Listen for updates with proper cleanup
      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          const handleStateChange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Could emit event here for update notification
            }
          };
          
          newWorker.addEventListener('statechange', handleStateChange);
          
          // Store cleanup function
          return () => {
            newWorker.removeEventListener('statechange', handleStateChange);
          };
        }
      };
      
      registration.addEventListener('updatefound', handleUpdateFound);
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, []);

  // Install click handler for banner
  const handleInstallClick = useCallback(async () => {
    const success = await triggerInstall();
    if (success) {
      setShowBanner(false);
    }
  }, [triggerInstall]);

  // Dismiss handler with session persistence for banner
  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    
    // Clear timeout if user dismisses before auto-show
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Persist dismissal for session (client-side only)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      } catch (error) {
        console.warn('Failed to persist prompt dismissal:', error);
      }
    }
  }, []);

  // Main effect for component initialization
  useEffect(() => {
    // Mark as client-side for safe storage access
    setIsClient(true);
    
    // Register service worker on load
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerServiceWorker, { once: true });
    } else {
      registerServiceWorker();
    }
    
    // Cleanup function
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Remove event listeners
      window.removeEventListener('load', registerServiceWorker);
    };
  }, [registerServiceWorker]);

  // Show banner after delay when app becomes installable
  useEffect(() => {
    if (canInstall && !isBannerDismissed() && !showBanner) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Show banner after delay
      timeoutRef.current = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [canInstall, showBanner, isBannerDismissed]);

  // Early returns for non-display states
  if (!isClient || !showBanner || !canInstall) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-50 border border-blue-500/20"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div 
            className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              id="pwa-install-title" 
              className="font-semibold text-sm"
            >
              Install Profolio
            </h3>
            <p 
              id="pwa-install-description" 
              className="text-xs text-blue-100 mt-1"
            >
              Add to your home screen for the best experience
            </p>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 p-1 h-auto flex-shrink-0"
          aria-label="Dismiss install prompt"
          disabled={isInstalling}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleInstallClick}
          className="bg-white text-blue-600 hover:bg-blue-50 flex-1 text-sm py-2"
          aria-describedby="pwa-install-description"
          disabled={isInstalling}
        >
          {isInstalling ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
              Installing...
            </>
          ) : (
            'Install App'
          )}
        </Button>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          className="text-white hover:bg-white/20 text-sm py-2"
          disabled={isInstalling}
        >
          Not now
        </Button>
      </div>
    </div>
  );
});

PWAManager.displayName = 'PWAManager';

export default PWAManager; 