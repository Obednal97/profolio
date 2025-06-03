// Demo Session Management
// Handles temporary 24-hour demo sessions with client-side validation

export interface DemoSessionInfo {
  isValid: boolean;
  remainingTime: number;
  sessionId?: string;
  serverValidated?: boolean;
}

/**
 * Generate a secure random ID using built-in crypto
 */
function generateSecureId(length: number = 16): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, length);
  }
  
  // Fallback for environments without crypto.randomUUID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class DemoSessionManager {
  private static readonly DEMO_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private static readonly DEMO_SESSION_KEY = 'demo-session-start';
  private static readonly DEMO_MODE_KEY = 'demo-mode';
  private static readonly DEMO_SESSION_ID_KEY = 'demo-session-id';
  private static readonly DEMO_TOKEN_KEY = 'demo-session-token';
  private static periodicCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Generate a cryptographically secure session token
   */
  private static generateSecureToken(): string {
    const timestamp = Date.now().toString();
    const randomId = generateSecureId(32);
    const data = `${timestamp}-${randomId}`;
    
    // Simple obfuscation (in production, use proper crypto)
    return btoa(data).replace(/[+/=]/g, '');
  }

  /**
   * Validate session token integrity
   */
  private static validateToken(token: string): boolean {
    try {
      const decoded = atob(token);
      const [timestamp, randomId] = decoded.split('-');
      
      // Check if token format is valid
      if (!timestamp || !randomId || randomId.length !== 32) {
        return false;
      }
      
      // Check if timestamp is reasonable (not too old or in future)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = this.DEMO_SESSION_DURATION + (60 * 60 * 1000); // Allow 1 hour buffer
      
      if (isNaN(tokenTime) || tokenTime > now || (now - tokenTime) > maxAge) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start a new demo session (client-side only for now)
   */
  static startDemoSession(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const sessionId = generateSecureId(16);
      const token = this.generateSecureToken();
      const startTime = Date.now();

      // Store session data securely
      localStorage.setItem(this.DEMO_MODE_KEY, 'true');
      localStorage.setItem(this.DEMO_SESSION_KEY, startTime.toString());
      sessionStorage.setItem(this.DEMO_SESSION_ID_KEY, sessionId);
      sessionStorage.setItem(this.DEMO_TOKEN_KEY, token);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 Demo session started - expires in 24 hours');
      }
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to start demo session:', error);
      }
      return false;
    }
  }

  /**
   * Check demo session validity (client-side validation)
   */
  static checkDemoSession(): DemoSessionInfo {
    if (typeof window === 'undefined') {
      return { isValid: false, remainingTime: 0 };
    }
    
    const isDemoMode = localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
    if (!isDemoMode) {
      return { isValid: false, remainingTime: 0 };
    }

    const demoStartTime = localStorage.getItem(this.DEMO_SESSION_KEY);
    const sessionId = sessionStorage.getItem(this.DEMO_SESSION_ID_KEY);
    const token = sessionStorage.getItem(this.DEMO_TOKEN_KEY);

    if (!demoStartTime || !sessionId || !token) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🎭 Demo session data incomplete - ending session');
      }
      this.endDemoSession();
      return { isValid: false, remainingTime: 0 };
    }

    // Validate token integrity first
    if (!this.validateToken(token)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🎭 Demo session token invalid - ending session');
      }
      this.endDemoSession();
      return { isValid: false, remainingTime: 0 };
    }

    const sessionAge = Date.now() - parseInt(demoStartTime);
    const remainingTime = this.DEMO_SESSION_DURATION - sessionAge;

    // Check client-side expiration
    if (sessionAge > this.DEMO_SESSION_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 Demo session expired after 24 hours');
      }
      this.endDemoSession();
      return { isValid: false, remainingTime: 0 };
    }

    if (process.env.NODE_ENV === 'development') {
      const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      console.log(`🎭 Demo session active - ${remainingHours}h ${remainingMinutes}m remaining`);
    }
    
    return { 
      isValid: true, 
      remainingTime,
      sessionId,
      serverValidated: false // No server validation for now
    };
  }

  /**
   * End demo session and clean up
   */
  static endDemoSession(): void {
    if (typeof window === 'undefined') return;
    
    // Clear demo session storage
    localStorage.removeItem(this.DEMO_MODE_KEY);
    localStorage.removeItem(this.DEMO_SESSION_KEY);
    sessionStorage.removeItem(this.DEMO_SESSION_ID_KEY);
    sessionStorage.removeItem(this.DEMO_TOKEN_KEY);
    localStorage.removeItem('demo-last-server-check');
    localStorage.removeItem('user-data');
    localStorage.removeItem('demo-api-keys');
    
    // Clear auth cookies securely
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict';
    
    // Clear periodic check interval
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 Demo session ended - all temporary data cleared');
    }
    
    // Redirect to landing page
    window.location.href = '/';
  }

  /**
   * Get remaining time as formatted string
   */
  static getRemainingTimeString(): string {
    const sessionInfo = this.checkDemoSession();
    if (sessionInfo.remainingTime <= 0) return 'Expired';

    const hours = Math.floor(sessionInfo.remainingTime / (60 * 60 * 1000));
    const minutes = Math.floor((sessionInfo.remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Check if currently in demo mode (lightweight check)
   */
  static isDemoMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
  }

  /**
   * Setup periodic session validation
   */
  static setupPeriodicCheck(): void {
    if (typeof window === 'undefined') return;

    // Clear any existing interval
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
    }

    // Check every 5 minutes
    this.periodicCheckInterval = setInterval(() => {
      if (this.isDemoMode()) {
        const sessionInfo = this.checkDemoSession();
        if (!sessionInfo.isValid) {
          this.endDemoSession();
        }
      }
    }, 5 * 60 * 1000);
  }
}

// Initialize periodic checking when this module is imported
if (typeof window !== 'undefined') {
  DemoSessionManager.setupPeriodicCheck();
} 