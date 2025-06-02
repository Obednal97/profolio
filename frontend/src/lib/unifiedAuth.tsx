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
                
                // Set user profile from Firebase data
                setUserProfile({
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  email: firebaseUser.email || '',
                  phone: firebaseUser.phoneNumber || '',
                  photoURL: firebaseUser.photoURL || '',
                });
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
    if (authMode === 'local') {
      await localAuth.fetchUserProfile();
    }
    // For Firebase, profile is automatically updated via auth state change
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