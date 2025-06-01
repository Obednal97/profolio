// Authentication Configuration
// Determines whether to use Firebase (hosted) or Local (self-hosted) authentication

export interface AuthConfig {
  mode: 'local' | 'firebase';
  enableGoogleAuth: boolean;
  enableDemoMode: boolean;
  backendUrl: string;
}

// Detect authentication mode based on environment and configuration
function detectAuthMode(): AuthConfig['mode'] {
  // Check if we're in a self-hosted environment
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Check if Firebase config is available
  const hasFirebaseConfig = typeof window !== 'undefined' && 
    localStorage.getItem('firebase-available') === 'true';
  
  // Check environment variable for forced mode
  const forcedMode = process.env.NEXT_PUBLIC_AUTH_MODE as 'local' | 'firebase' | undefined;
  
  if (forcedMode) {
    return forcedMode;
  }
  
  // Auto-detect based on environment
  if (isLocalhost || !hasFirebaseConfig) {
    return 'local';
  }
  
  return 'firebase';
}

// Check if Firebase config is available
async function checkFirebaseAvailability(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const response = await fetch('/firebase-config.json');
    const isAvailable = response.ok;
    
    // Cache the result
    localStorage.setItem('firebase-available', isAvailable.toString());
    
    return isAvailable;
  } catch {
    localStorage.setItem('firebase-available', 'false');
    return false;
  }
}

// Get authentication configuration
export async function getAuthConfig(): Promise<AuthConfig> {
  // Check Firebase availability first
  await checkFirebaseAvailability();
  
  const mode = detectAuthMode();
  
  return {
    mode,
    enableGoogleAuth: mode === 'firebase', // Only enable Google auth for Firebase mode
    enableDemoMode: true, // Always allow demo mode
    backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  };
}

// Auth mode detection for immediate use (synchronous)
export function getAuthModeSync(): AuthConfig['mode'] {
  if (typeof window === 'undefined') return 'local';
  
  const forcedMode = process.env.NEXT_PUBLIC_AUTH_MODE as 'local' | 'firebase' | undefined;
  if (forcedMode) return forcedMode;
  
  const hasFirebaseConfig = localStorage.getItem('firebase-available') === 'true';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  return (isLocalhost || !hasFirebaseConfig) ? 'local' : 'firebase';
}

// Environment-specific settings
export const authSettings = {
  // Password requirements
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // Session settings
  tokenExpiry: '7d',
  rememberMe: true,
  
  // UI settings
  showProviderLabels: true,
  allowAccountCreation: true,
  showForgotPassword: true,
}; 