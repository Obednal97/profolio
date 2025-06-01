// Local Authentication Service - No Firebase dependency
// This service talks to the backend API for self-hosted authentication

export interface LocalUser {
  id: string;
  email: string;
  name?: string | null;
  token: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface SignUpResponse {
  token: string;
}

class LocalAuthService {
  private baseUrl: string;
  private currentUser: LocalUser | null = null;
  private authListeners: ((user: LocalUser | null) => void)[] = [];

  constructor() {
    // Use environment variable or default to backend URL
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Initialize user from localStorage on startup
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('auth-token');
    const userData = localStorage.getItem('user-data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUser = { ...user, token };
        this.notifyListeners();
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearStorage();
      }
    }
  }

  private clearStorage() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');
    localStorage.removeItem('demo-mode');
  }

  private notifyListeners() {
    this.authListeners.forEach(listener => listener(this.currentUser));
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async signUp(email: string, password: string, name?: string): Promise<LocalUser> {
    try {
      const response: SignUpResponse = await this.apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      const user: LocalUser = {
        id: 'temp-id', // Backend should return user ID
        email,
        name: name || null,
        token: response.token,
      };

      // Store authentication data
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('user-data', JSON.stringify(user));
      
      this.currentUser = user;
      this.notifyListeners();
      
      return user;
    } catch (error) {
      throw new Error(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signIn(email: string, password: string): Promise<LocalUser> {
    try {
      const response: SignUpResponse = await this.apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user: LocalUser = {
        id: 'temp-id', // Backend should return user ID
        email,
        name: null, // We'll get this from user profile endpoint
        token: response.token,
      };

      // Store authentication data
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('user-data', JSON.stringify(user));
      
      this.currentUser = user;
      this.notifyListeners();
      
      // Fetch user profile to get name and other details
      try {
        await this.fetchUserProfile();
      } catch (profileError) {
        console.warn('Failed to fetch user profile:', profileError);
      }
      
      return user;
    } catch (error) {
      throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Invalid credentials'}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      // Call backend signout endpoint if user is authenticated
      if (this.currentUser?.token) {
        await this.apiRequest('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentUser.token}`,
          },
        }).catch(error => {
          console.warn('Backend signout failed:', error);
          // Continue with local signout even if backend fails
        });
      }
    } finally {
      // Always clear local state
      this.clearStorage();
      this.currentUser = null;
      this.notifyListeners();
    }
  }

  async fetchUserProfile(): Promise<void> {
    if (!this.currentUser?.token) return;

    try {
      const profile = await this.apiRequest('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`,
        },
      });

      // Update current user with profile data
      this.currentUser = {
        ...this.currentUser,
        id: profile.id,
        name: profile.name,
      };

      // Update stored user data
      localStorage.setItem('user-data', JSON.stringify(this.currentUser));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }

  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.currentUser?.token || null;
  }

  onAuthStateChange(callback: (user: LocalUser | null) => void): () => void {
    this.authListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  // Demo mode support
  async signInWithDemo(): Promise<LocalUser> {
    const demoUser: LocalUser = {
      id: 'demo-user-id',
      email: 'demo@profolio.com',
      name: 'Demo User',
      token: 'demo-token-secure-123',
    };

    localStorage.setItem('auth-token', demoUser.token);
    localStorage.setItem('user-data', JSON.stringify(demoUser));
    localStorage.setItem('demo-mode', 'true');
    
    this.currentUser = demoUser;
    this.notifyListeners();
    
    return demoUser;
  }

  isDemoMode(): boolean {
    return typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  }
}

// Export singleton instance
export const localAuth = new LocalAuthService();

// Export convenience functions
export const signUpWithLocal = (email: string, password: string, name?: string) => 
  localAuth.signUp(email, password, name);

export const signInWithLocal = (email: string, password: string) => 
  localAuth.signIn(email, password);

export const signOutLocal = () => localAuth.signOut();

export const onLocalAuthStateChange = (callback: (user: LocalUser | null) => void) => 
  localAuth.onAuthStateChange(callback);

export const getCurrentLocalUser = () => localAuth.getCurrentUser();

export const getLocalAuthToken = () => localAuth.getToken();

export const signInWithDemoLocal = () => localAuth.signInWithDemo(); 