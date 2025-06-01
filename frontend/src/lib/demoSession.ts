// Demo Session Management
// Handles temporary 24-hour demo sessions that don't persist user data

export class DemoSessionManager {
  private static readonly DEMO_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private static readonly DEMO_SESSION_KEY = 'demo-session-start';
  private static readonly DEMO_MODE_KEY = 'demo-mode';

  static startDemoSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.DEMO_MODE_KEY, 'true');
    localStorage.setItem(this.DEMO_SESSION_KEY, Date.now().toString());
    console.log('🎭 Demo session started - expires in 24 hours');
  }

  static checkDemoSession(): { isValid: boolean; remainingTime: number } {
    if (typeof window === 'undefined') return { isValid: false, remainingTime: 0 };
    
    const isDemoMode = localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
    if (!isDemoMode) return { isValid: false, remainingTime: 0 };

    const demoStartTime = localStorage.getItem(this.DEMO_SESSION_KEY);
    if (!demoStartTime) {
      // No start time found, start new session
      this.startDemoSession();
      return { isValid: true, remainingTime: this.DEMO_SESSION_DURATION };
    }

    const sessionAge = Date.now() - parseInt(demoStartTime);
    const remainingTime = this.DEMO_SESSION_DURATION - sessionAge;

    if (sessionAge > this.DEMO_SESSION_DURATION) {
      // Session expired
      console.log('🎭 Demo session expired after 24 hours');
      this.endDemoSession();
      return { isValid: false, remainingTime: 0 };
    }

    const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
    const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    console.log(`🎭 Demo session active - ${remainingHours}h ${remainingMinutes}m remaining`);
    
    return { isValid: true, remainingTime };
  }

  static endDemoSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.DEMO_MODE_KEY);
    localStorage.removeItem(this.DEMO_SESSION_KEY);
    localStorage.removeItem('user-data');
    console.log('🎭 Demo session ended - all temporary data cleared');
    
    // Redirect to landing page
    window.location.href = '/';
  }

  static getRemainingTimeString(): string {
    const { remainingTime } = this.checkDemoSession();
    if (remainingTime <= 0) return 'Expired';

    const hours = Math.floor(remainingTime / (60 * 60 * 1000));
    const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  static isDemoMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
  }

  static setupPeriodicCheck(): void {
    if (typeof window === 'undefined') return;

    // Check every 5 minutes
    setInterval(() => {
      const { isValid } = this.checkDemoSession();
      if (!isValid && this.isDemoMode()) {
        // Session expired
        this.endDemoSession();
      }
    }, 5 * 60 * 1000);
  }
}

// Initialize periodic checking when this module is imported
if (typeof window !== 'undefined') {
  DemoSessionManager.setupPeriodicCheck();
} 