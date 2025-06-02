// Demo Session Management
// Handles temporary 24-hour demo sessions with server-side validation

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
   * Validate demo session with server
   */
  private static async validateWithServer(sessionId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/demo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, token }),
      });

      if (!response.ok) {
        console.warn('Demo session server validation failed');
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Demo session server validation error:', error);
      return false;
    }
  }

  /**
   * Start a new demo session with server-side validation
   */
  static async startDemoSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      const sessionId = generateSecureId(16);
      const token = this.generateSecureToken();
      const startTime = Date.now();

      // Register session with server
      const response = await fetch('/api/demo/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, token, startTime }),
      });

      if (!response.ok) {
        throw new Error('Failed to start demo session on server');
      }

      // Store session data locally (but rely on server validation)
      localStorage.setItem(this.DEMO_MODE_KEY, 'true');
      localStorage.setItem(this.DEMO_SESSION_KEY, startTime.toString());
      localStorage.setItem(this.DEMO_SESSION_ID_KEY, sessionId);
      localStorage.setItem(this.DEMO_TOKEN_KEY, token);
      
      console.log('🎭 Demo session started with server validation - expires in 24 hours');
      return true;
    } catch (error) {
      console.error('Failed to start demo session:', error);
      return false;
    }
  }

  /**
   * Check demo session validity with server-side validation
   */
  static async checkDemoSession(): Promise<DemoSessionInfo> {
    if (typeof window === 'undefined') {
      return { isValid: false, remainingTime: 0 };
    }
    
    const isDemoMode = localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
    if (!isDemoMode) {
      return { isValid: false, remainingTime: 0 };
    }

    const demoStartTime = localStorage.getItem(this.DEMO_SESSION_KEY);
    const sessionId = localStorage.getItem(this.DEMO_SESSION_ID_KEY);
    const token = localStorage.getItem(this.DEMO_TOKEN_KEY);

    if (!demoStartTime || !sessionId || !token) {
      console.warn('🎭 Demo session data incomplete - ending session');
      this.endDemoSession();
      return { isValid: false, remainingTime: 0 };
    }

    // Validate token integrity first
    if (!this.validateToken(token)) {
      console.warn('🎭 Demo session token invalid - ending session');
      this.endDemoSession();
      return { isValid: false, remainingTime: 0 };
    }

    const sessionAge = Date.now() - parseInt(demoStartTime);
    const remainingTime = this.DEMO_SESSION_DURATION - sessionAge;

    // Check client-side expiration first
    if (sessionAge > this.DEMO_SESSION_DURATION) {
      console.log('🎭 Demo session expired after 24 hours');
      this.endDemoSession();
      return { isValid: false, remainingTime: 0 };
    }

    // Validate with server every 10 minutes or if requested
    const lastServerCheck = localStorage.getItem('demo-last-server-check');
    const now = Date.now();
    const shouldCheckServer = !lastServerCheck || 
      (now - parseInt(lastServerCheck)) > (10 * 60 * 1000); // 10 minutes

    if (shouldCheckServer) {
      const serverValid = await this.validateWithServer(sessionId, token);
      localStorage.setItem('demo-last-server-check', now.toString());
      
      if (!serverValid) {
        console.warn('🎭 Demo session invalid on server - ending session');
        this.endDemoSession();
        return { isValid: false, remainingTime: 0 };
      }
    }

    const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
    const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    console.log(`🎭 Demo session active - ${remainingHours}h ${remainingMinutes}m remaining`);
    
    return { 
      isValid: true, 
      remainingTime,
      sessionId,
      serverValidated: true
    };
  }

  /**
   * End demo session and clean up
   */
  static async endDemoSession(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const sessionId = localStorage.getItem(this.DEMO_SESSION_ID_KEY);
    
    // Notify server of session end (best effort)
    if (sessionId) {
      try {
        await fetch('/api/demo/end', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        // Ignore errors - session will expire on server anyway
      }
    }
    
    // Clear all local storage
    localStorage.removeItem(this.DEMO_MODE_KEY);
    localStorage.removeItem(this.DEMO_SESSION_KEY);
    localStorage.removeItem(this.DEMO_SESSION_ID_KEY);
    localStorage.removeItem(this.DEMO_TOKEN_KEY);
    localStorage.removeItem('demo-last-server-check');
    localStorage.removeItem('user-data');
    
    // Clear periodic check interval
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
    }
    
    console.log('🎭 Demo session ended - all temporary data cleared');
    
    // Redirect to landing page
    window.location.href = '/';
  }

  /**
   * Get remaining time as formatted string
   */
  static async getRemainingTimeString(): Promise<string> {
    const sessionInfo = await this.checkDemoSession();
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
    this.periodicCheckInterval = setInterval(async () => {
      if (this.isDemoMode()) {
        const sessionInfo = await this.checkDemoSession();
        if (!sessionInfo.isValid) {
          this.endDemoSession();
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Force server validation of current session
   */
  static async forceServerValidation(): Promise<boolean> {
    const sessionId = localStorage.getItem(this.DEMO_SESSION_ID_KEY);
    const token = localStorage.getItem(this.DEMO_TOKEN_KEY);

    if (!sessionId || !token) return false;

    const isValid = await this.validateWithServer(sessionId, token);
    if (!isValid) {
      this.endDemoSession();
    }

    return isValid;
  }
}

// Initialize periodic checking when this module is imported
if (typeof window !== 'undefined') {
  DemoSessionManager.setupPeriodicCheck();
} 