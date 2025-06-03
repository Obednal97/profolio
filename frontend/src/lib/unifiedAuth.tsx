'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthConfig, AuthConfig } from './authConfig';
import { LocalUser, localAuth } from './localAuth';

// Firebase User type (minimal interface for what we need)
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

// Unified user interface that works for both Firebase and local users
export interface UnifiedUser {
  id: string;
  email: string | null;
  name?: string | null;
  token?: string | null;
  // Firebase compatibility
  uid?: string;
  displayName?: string | null;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
}

interface UnifiedAuthContextType {
  user: UnifiedUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authMode: AuthConfig['mode'];
  config: AuthConfig | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogleProvider?: () => Promise<unknown>;
  signOut: () => Promise<void>;
  resetUserPassword?: (email: string) => Promise<void>;
  signInWithDemo: () => Promise<void>;
  token: string | null;
  refreshUserProfile: () => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | null>(null);

// Convert LocalUser to UnifiedUser
function localUserToUnified(localUser: LocalUser): UnifiedUser {
  return {
    id: localUser.id,
    uid: localUser.id, // Firebase compatibility
    email: localUser.email,
    name: localUser.name,
    displayName: localUser.name, // Firebase compatibility
    token: localUser.token,
  };
}

// Convert Firebase User to UnifiedUser
function firebaseUserToUnified(firebaseUser: FirebaseUser): UnifiedUser {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName,
    displayName: firebaseUser.displayName,
    token: null, // Will be set separately
  };
}

// Secure token management for httpOnly cookies
function getSecureToken(): string | null {
  if (typeof window !== 'undefined' && window.isSecureContext) {
    // Read from httpOnly cookie set by server
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    return cookieValue || null;
  }
  return null;
}

function setSecureToken(token: string): void {
  // Note: httpOnly cookies must be set by the server
  // This is a client-side fallback for development
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      // Development: Use secure cookie attributes
      document.cookie = `auth-token=${token}; Secure; SameSite=Strict; Path=/; Max-Age=86400`;
    } else {
      // Production: Token should be set by server as httpOnly cookie
      console.warn('Token should be set by server as httpOnly cookie in production');
    }
  }
}

function clearSecureToken(): void {
  if (typeof window !== 'undefined') {
    // Clear the cookie by setting expired date
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict';
  }
}

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [authMode, setAuthMode] = useState<AuthConfig['mode']>('local');

  // Initialize authentication system
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Initialize token from secure cookie
    const initialToken = getSecureToken();
    if (initialToken) {
      setToken(initialToken);
    }

    const initializeAuth = async () => {
      try {
        // Get auth configuration
        const authConfig = await getAuthConfig();
        setConfig(authConfig);
        setAuthMode(authConfig.mode);

        if (authConfig.mode === 'local') {
          // Use local authentication
          unsubscribe = localAuth.onAuthStateChange((localUser) => {
            if (localUser) {
              const unifiedUser = localUserToUnified(localUser);
              setUser(unifiedUser);
              setToken(localUser.token);
              
              // Set user profile from local user data
              setUserProfile({
                name: localUser.name || localUser.email?.split('@')[0] || 'User',
                email: localUser.email,
                phone: '',
                photoURL: '',
              });
            } else {
              setUser(null);
              setToken(null);
              setUserProfile(null);
            }
            setLoading(false);
          });
        } else {
          // Use Firebase authentication (dynamic import to avoid errors when Firebase config is missing)
          try {
            const { onAuthStateChange, getUserToken } = await import('./firebase');
            
            unsubscribe = await onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
              if (firebaseUser) {
                const unifiedUser = firebaseUserToUnified(firebaseUser);
                setUser(unifiedUser);
                
                // Get Firebase token
                try {
                  const userToken = await getUserToken();
                  setToken(userToken);
                } catch (tokenError) {
                  console.warn('Failed to get Firebase token:', tokenError);
                }
                
                // FETCH profile from backend - this should be the authoritative source
                try {
                  console.log('🔄 [Auth] Fetching profile from backend during auth state change...');
                  
                  // Get fresh Firebase token for backend authentication
                  const { getFirebaseAuth } = await import('./firebase');
                  const auth = await getFirebaseAuth();
                  const currentUser = auth.currentUser;
                  
                  if (!currentUser) {
                    throw new Error('No current Firebase user');
                  }
                  
                  const firebaseToken = await currentUser.getIdToken(true); // Force refresh
                  
                  // Exchange for backend JWT token
                  const response = await fetch('/api/auth/firebase-exchange', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firebaseToken }),
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.token) {
                      // Store the backend token securely
                      setSecureToken(data.token);
                      setToken(data.token);
                      
                      // Fetch profile from backend
                      const profileResponse = await fetch('/api/auth/profile', {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${data.token}`,
                        },
                      });
                      
                      if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        
                        if (profileData.success && profileData.user) {
                          console.log('✅ [Auth] Backend profile found, using:', profileData.user.name);
                          
                          // Use backend profile as authoritative source
                          setUserProfile({
                            name: profileData.user.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            email: profileData.user.email || firebaseUser.email || '',
                            phone: profileData.user.phone || firebaseUser.phoneNumber || '',
                            photoURL: profileData.user.photoURL || firebaseUser.photoURL || '',
                          });
                        } else {
                          console.log('ℹ️ [Auth] No backend profile found, using Firebase data as fallback');
                          
                          // No backend profile yet, use Firebase data as fallback
                          setUserProfile({
                            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            email: firebaseUser.email || '',
                            phone: firebaseUser.phoneNumber || '',
                            photoURL: firebaseUser.photoURL || '',
                          });
                        }
                      } else {
                        console.warn('⚠️ [Auth] Failed to fetch profile, using Firebase data');
                        
                        // Profile fetch failed, use Firebase data
                        setUserProfile({
                          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                          email: firebaseUser.email || '',
                          phone: firebaseUser.phoneNumber || '',
                          photoURL: firebaseUser.photoURL || '',
                        });
                      }
                    } else {
                      console.warn('⚠️ [Auth] Token exchange failed, using Firebase data');
                      
                      // Token exchange failed, use Firebase data
                      setUserProfile({
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                        email: firebaseUser.email || '',
                        phone: firebaseUser.phoneNumber || '',
                        photoURL: firebaseUser.photoURL || '',
                      });
                    }
                  } else {
                    console.warn('⚠️ [Auth] Token exchange request failed, using Firebase data');
                    
                    // Token exchange request failed, use Firebase data
                    setUserProfile({
                      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                      email: firebaseUser.email || '',
                      phone: firebaseUser.phoneNumber || '',
                      photoURL: firebaseUser.photoURL || '',
                    });
                  }
                } catch (error) {
                  console.error('❌ [Auth] Error fetching backend profile during auth state change:', error);
                  
                  // Error occurred, fallback to Firebase data
                  setUserProfile({
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email || '',
                    phone: firebaseUser.phoneNumber || '',
                    photoURL: firebaseUser.photoURL || '',
                  });
                }
              } else {
                setUser(null);
                setToken(null);
                setUserProfile(null);
              }
              setLoading(false);
            });
          } catch (error) {
            console.error('Firebase initialization failed, falling back to local auth:', error);
            // Fall back to local auth if Firebase fails
            setAuthMode('local');
            setConfig({ ...authConfig, mode: 'local', enableGoogleAuth: false });
            
            unsubscribe = localAuth.onAuthStateChange((localUser) => {
              if (localUser) {
                const unifiedUser = localUserToUnified(localUser);
                setUser(unifiedUser);
                setToken(localUser.token);
                setUserProfile({
                  name: localUser.name || localUser.email?.split('@')[0] || 'User',
                  email: localUser.email,
                  phone: '',
                  photoURL: '',
                });
              } else {
                setUser(null);
                setToken(null);
                setUserProfile(null);
              }
              setLoading(false);
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (authMode === 'local') {
        await localAuth.signIn(email, password);
      } else {
        const { signInWithEmail } = await import('./firebase');
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      if (authMode === 'local') {
        await localAuth.signUp(email, password, displayName);
      } else {
        const { signUpWithEmail } = await import('./firebase');
        await signUpWithEmail(email, password, displayName);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogleProvider = authMode === 'firebase' ? async () => {
    setLoading(true);
    try {
      const { signInWithGoogle } = await import('./firebase');
      return await signInWithGoogle();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  } : undefined;

  const signOut = async () => {
    setLoading(true);
    try {
      // Check for demo mode first and handle it properly
      if (typeof window !== 'undefined') {
        const { DemoSessionManager } = await import('@/lib/demoSession');
        if (DemoSessionManager.isDemoMode()) {
          DemoSessionManager.endDemoSession();
          // endDemoSession() handles redirect automatically
          return;
        }
      }
      
      if (authMode === 'local') {
        await localAuth.signOut();
      } else {
        const { signOutUser } = await import('./firebase');
        await signOutUser();
      }
      
      // Clear local state
      setUser(null);
      setToken(null);
      setUserProfile(null);
      
      // Clear secure token
      clearSecureToken();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state even if sign out fails
      setUser(null);
      setToken(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = authMode === 'firebase' ? async (email: string) => {
    const { resetPassword } = await import('./firebase');
    await resetPassword(email);
  } : undefined;

  const signInWithDemo = async () => {
    await localAuth.signInWithDemo();
  };

  const refreshUserProfile = async () => {
    try {
      if (authMode === 'local') {
        await localAuth.fetchUserProfile();
      } else if (authMode === 'firebase' && user) {
        // For Firebase users, fetch the updated profile from the backend
        console.log('🔄 [Auth] Refreshing Firebase user profile...');
        
        // Get Firebase token for backend authentication
        const { getFirebaseAuth } = await import('./firebase');
        const auth = await getFirebaseAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          console.warn('⚠️ [Auth] No Firebase user found during profile refresh');
          return;
        }
        
        // Get fresh Firebase token
        const firebaseToken = await currentUser.getIdToken(true); // Force refresh
        
        // Exchange for backend JWT token
        const response = await fetch('/api/auth/firebase-exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ firebaseToken }),
        });
        
        if (!response.ok) {
          console.error('❌ [Auth] Token exchange failed during profile refresh');
          return;
        }
        
        const data = await response.json();
        if (!data.success || !data.token) {
          console.error('❌ [Auth] Invalid token exchange response');
          return;
        }
        
        // Fetch updated profile from backend
        const profileResponse = await fetch('/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.token}`,
          },
        });
        
        if (!profileResponse.ok) {
          console.error('❌ [Auth] Failed to fetch profile:', profileResponse.status);
          return;
        }
        
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.user) {
          console.log('✅ [Auth] Profile refreshed successfully:', profileData.user.name);
          
          // Update userProfile state with fresh data from backend
          setUserProfile({
            name: profileData.user.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: profileData.user.email || currentUser.email || '',
            phone: profileData.user.phone || currentUser.phoneNumber || '',
            photoURL: profileData.user.photoURL || currentUser.photoURL || '',
          });
          
          // Also update the auth token securely for future requests
          setSecureToken(data.token);
          setToken(data.token);
        } else {
          console.log('ℹ️ [Auth] No updated profile found in backend, using Firebase data');
          
          // Fallback to Firebase data if no backend profile exists
          setUserProfile({
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
            photoURL: currentUser.photoURL || '',
          });
        }
      }
    } catch (error) {
      console.error('❌ [Auth] Failed to refresh user profile:', error);
      // Don't throw error to avoid breaking the UI
    }
  };

  const value: UnifiedAuthContextType = {
    user,
    userProfile,
    loading,
    authMode,
    config,
    signIn,
    signUp,
    signInWithGoogleProvider,
    signOut,
    resetUserPassword,
    signInWithDemo,
    token,
    refreshUserProfile,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider');
  }
  return context;
}

// Legacy compatibility - export the same interface as the old auth
export function useAuth() {
  return useUnifiedAuth();
} 