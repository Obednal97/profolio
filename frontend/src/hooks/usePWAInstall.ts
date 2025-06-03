'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

interface PWAInstallState {
  isInstallable: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  isInstalling: boolean;
}

interface PWAInstallActions {
  showInstallPrompt: () => Promise<boolean>;
  checkInstallability: () => boolean;
}

// Constants to prevent recreation
const DETECTION_INTERVAL = 10000; // Reduced frequency: every 10 seconds
const STORAGE_KEY = 'pwa-installed';

/**
 * Custom hook for PWA installation management
 * 
 * Provides shared logic for detecting PWA installability and triggering installation
 * Can be used across multiple components (PWAManager, UserMenu, etc.)
 * 
 * Enterprise-grade implementation with optimized performance and resource management
 * 
 * @returns {PWAInstallState & PWAInstallActions} State and actions for PWA installation
 */
export function usePWAInstall(): PWAInstallState & PWAInstallActions {
  // State management
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Refs for cleanup management and preventing stale closures
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaQueryRefs = useRef<MediaQueryList[]>([]);
  const lastCheckTimeRef = useRef<number>(0);
  
  // Memoized URL search params to prevent repeated parsing
  const urlSearchParams = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return new URLSearchParams(window.location.search);
    } catch {
      return null;
    }
  }, []);

  // Memoized localStorage access with error handling
  const getStorageValue = useCallback((key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ LocalStorage access failed for key "${key}":`, error);
      }
      return null;
    }
  }, []);

  const setStorageValue = useCallback((key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ LocalStorage write failed for key "${key}":`, error);
      }
      return false;
    }
  }, []);

  // Memoized console methods to handle environments where they don't exist
  const safeConsole = useMemo(() => ({
    log: typeof console !== 'undefined' && console.log ? console.log.bind(console) : () => {},
    warn: typeof console !== 'undefined' && console.warn ? console.warn.bind(console) : () => {},
    error: typeof console !== 'undefined' && console.error ? console.error.bind(console) : () => {},
  }), []);

  // Enhanced standalone detection function with memoization
  const checkStandalone = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Throttle checks to prevent excessive DOM queries
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 1000) { // Max once per second
      return isStandalone; // Return current state if checked recently
    }
    lastCheckTimeRef.current = now;
    
    // Memoized detection methods for comprehensive coverage
    const standaloneChecks = [
      // PWA display mode detection (most reliable)
      () => window.matchMedia('(display-mode: standalone)').matches,
      
      // iOS Safari standalone detection
      () => navigator.standalone === true,
      
      // Android app context detection
      () => document.referrer.includes('android-app://'),
      
      // Additional PWA context checks
      () => window.matchMedia('(display-mode: fullscreen)').matches,
      () => window.matchMedia('(display-mode: minimal-ui)').matches,
      
      // URL parameter check (using memoized URLSearchParams)
      () => urlSearchParams?.has('pwa') === true,
      () => urlSearchParams?.get('utm_source') === 'pwa',
      
      // Persistent localStorage flag (using memoized getter)
      () => getStorageValue(STORAGE_KEY) === 'true'
    ];
    
    const isStandaloneResult = standaloneChecks.some(check => {
      try {
        return check();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          safeConsole.warn('⚠️ Standalone check failed:', error);
        }
        return false;
      }
    });
    
    // Debug logging for development (throttled)
    if (process.env.NODE_ENV === 'development' && now % 5000 < 1000) {
      safeConsole.log('🔍 PWA Standalone Detection:', {
        isStandalone: isStandaloneResult,
        displayMode: window.matchMedia('(display-mode: standalone)').matches,
        navigatorStandalone: navigator.standalone,
        referrer: document.referrer,
        localStorage: getStorageValue(STORAGE_KEY),
        throttled: true
      });
    }
    
    return isStandaloneResult;
  }, [isStandalone, urlSearchParams, getStorageValue, safeConsole]);

  // Optimized installability check with stable dependencies
  const checkInstallability = useCallback(() => {
    return isClient && !isStandalone && isInstallable && !!deferredPromptRef.current;
  }, [isClient, isStandalone, isInstallable]);

  // Show install prompt with comprehensive error handling
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) {
      safeConsole.warn('⚠️ No install prompt available');
      return false;
    }

    if (isInstalling) {
      safeConsole.warn('⚠️ Installation already in progress');
      return false;
    }

    setIsInstalling(true);

    try {
      await deferredPromptRef.current.prompt();
      const choiceResult = await deferredPromptRef.current.userChoice;
      
      const wasAccepted = choiceResult.outcome === 'accepted';
      
      if (wasAccepted) {
        safeConsole.log('✅ User accepted the install prompt');
        
        // Set persistent flag with error handling
        setStorageValue(STORAGE_KEY, 'true');
        
        // Update state immediately
        setIsInstallable(false);
        setIsStandalone(true);
        deferredPromptRef.current = null;
        
        // Clear interval since app is now installed
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        safeConsole.log('❌ User dismissed the install prompt');
      }
      
      return wasAccepted;
      
    } catch (error) {
      safeConsole.error('❌ Install prompt failed:', error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [isInstalling, safeConsole, setStorageValue]);

  // Stable event handlers with minimal dependencies
  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    // Don't capture prompt if already installed
    if (isStandalone) {
      safeConsole.log('📱 PWA install prompt ignored - app already installed');
      return;
    }
    
    e.preventDefault();
    const promptEvent = e as BeforeInstallPromptEvent;
    deferredPromptRef.current = promptEvent;
    setIsInstallable(true);
    
    safeConsole.log('📱 PWA install prompt available');
  }, [isStandalone, safeConsole]);

  const handleAppInstalled = useCallback(() => {
    safeConsole.log('✅ PWA was installed');
    
    // Set persistent flag
    setStorageValue(STORAGE_KEY, 'true');
    
    // Update state
    setIsInstallable(false);
    setIsStandalone(true);
    deferredPromptRef.current = null;
    
    // Clear interval since app is now installed
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [safeConsole, setStorageValue]);

  // Optimized state change handler with intelligent checking
  const handleStandaloneChange = useCallback(() => {
    // Skip check if we already know it's installed
    if (isStandalone && getStorageValue(STORAGE_KEY) === 'true') {
      return;
    }
    
    const newStandaloneState = checkStandalone();
    
    if (newStandaloneState !== isStandalone) {
      safeConsole.log(`🔄 PWA standalone state changed: ${isStandalone} → ${newStandaloneState}`);
      setIsStandalone(newStandaloneState);
      
      // If app became standalone, clean up and stop monitoring
      if (newStandaloneState) {
        setIsInstallable(false);
        deferredPromptRef.current = null;
        setStorageValue(STORAGE_KEY, 'true');
        
        // Clear interval since we no longer need to check
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  }, [isStandalone, checkStandalone, getStorageValue, setStorageValue, safeConsole]);

  // Initialize hook with proper cleanup and optimization
  useEffect(() => {
    // Mark as client-side for safe API access
    setIsClient(true);
    
    // Check initial standalone state
    const initialStandaloneState = checkStandalone();
    setIsStandalone(initialStandaloneState);
    
    // If already installed, don't set up listeners or intervals
    if (initialStandaloneState) {
      safeConsole.log('📱 PWA already installed - skipping install prompt setup');
      return;
    }
    
    // Setup event listeners for PWA events
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { passive: true });
    window.addEventListener('appinstalled', handleAppInstalled, { passive: true });
    
    // Setup media query listeners with proper cleanup tracking
    const mediaQueries = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: fullscreen)'),
      window.matchMedia('(display-mode: minimal-ui)')
    ];
    
    mediaQueryRefs.current = mediaQueries;
    
    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleStandaloneChange);
    });
    
    // Listen for visibility changes with passive option
    document.addEventListener('visibilitychange', handleStandaloneChange, { passive: true });
    
    // Reduced frequency interval check (only when not installed)
    intervalRef.current = setInterval(() => {
      // Double-check we still need this interval
      if (isStandalone || getStorageValue(STORAGE_KEY) === 'true') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      handleStandaloneChange();
    }, DETECTION_INTERVAL);
    
    // Comprehensive cleanup function
    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Remove event listeners
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      // Clean up media query listeners
      mediaQueryRefs.current.forEach(mq => {
        mq.removeEventListener('change', handleStandaloneChange);
      });
      mediaQueryRefs.current = [];
      
      document.removeEventListener('visibilitychange', handleStandaloneChange);
    };
  }, []); // Stable empty dependency array

  // Trigger state change check on key state changes
  useEffect(() => {
    if (isClient && !isStandalone) {
      handleStandaloneChange();
    }
  }, [isClient, handleStandaloneChange, isStandalone]);

  // Memoized derived state
  const canInstall = useMemo(() => checkInstallability(), [checkInstallability]);

  return {
    // State
    isInstallable,
    isStandalone,
    canInstall,
    isInstalling,
    
    // Actions
    showInstallPrompt,
    checkInstallability,
  };
} 