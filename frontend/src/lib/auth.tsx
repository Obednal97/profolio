'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserCredential } from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  onAuthStateChange,
  getUserToken
} from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogleProvider: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to extract and persist Google profile data
async function extractAndPersistGoogleProfile(user: User) {
  try {
    // Check if this is a Google sign-in
    const isGoogleProvider = user.providerData?.some(provider => provider.providerId === 'google.com');
    
    if (!isGoogleProvider) {
      return; // Not a Google sign-in, skip
    }

    // Extract basic profile data from Google (only what's readily available)
    const profileData = {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      // Phone number is optional - only include if user granted permission
      ...(user.phoneNumber && { phone: user.phoneNumber }),
      // We don't extract location/address from basic Google profile
      // Users can manually add their country in settings if they want
    };

    // Check if we already have this profile data stored
    const existingProfile = localStorage.getItem(`user-profile-${user.uid}`);
    const shouldUpdate = !existingProfile || 
      (existingProfile && JSON.parse(existingProfile).lastUpdated < Date.now() - 24 * 60 * 60 * 1000); // Update if older than 24 hours

    if (shouldUpdate) {
      // Save to our user API
      const { apiCall } = await import('./mockApi');
      
      const profileToSave = {
        ...profileData,
        lastUpdated: Date.now(),
        provider: 'google',
        // Add authentication metadata
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime,
      };

      await apiCall('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: 'UPDATE_PROFILE',
          userId: user.uid,
          profileData: profileToSave
        }),
      });

      console.log('✅ Google profile data persisted for user:', user.uid);
    }
  } catch (error) {
    console.error('❌ Failed to persist Google profile data:', error);
    // Don't throw - this shouldn't break the auth flow
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        unsubscribe = await onAuthStateChange(async (user) => {
          setUser(user);
          
          if (user) {
            // Extract and persist Google profile data if this is a Google sign-in
            await extractAndPersistGoogleProfile(user);
            
            // Get and store the user token
            const userToken = await getUserToken();
            setToken(userToken);
            localStorage.setItem('userToken', userToken || '');
          } else {
            setToken(null);
            localStorage.removeItem('userToken');
          }
          
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmail(email, password);
      // User state will be updated by the auth listener
    } catch (error: unknown) {
      setLoading(false);
      throw new Error(error instanceof Error ? error.message : 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      await signUpWithEmail(email, password, displayName);
      // User state will be updated by the auth listener
    } catch (error: unknown) {
      setLoading(false);
      throw new Error(error instanceof Error ? error.message : 'Failed to create account');
    }
  };

  const signInWithGoogleProvider = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      
      // Don't set loading to false here - let the auth state listener handle it
      // The auth state listener will update the user state and loading will be set to false
      
      return result;
    } catch (error: unknown) {
      setLoading(false);
      throw new Error(error instanceof Error ? error.message : 'Failed to sign in with Google');
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear any demo mode data first
      localStorage.removeItem('auth-token');
      localStorage.removeItem('demo-mode');
      localStorage.removeItem('user-data');
      localStorage.removeItem('demo-api-keys');
      localStorage.removeItem('userToken');
      
      // Clear any other potential auth-related localStorage items
      localStorage.removeItem('firebase:authUser:AIzaSyBvQvlrGjGjGjGjGjGjGjGjGjGjGjGjGjG:[DEFAULT]');
      
      // Sign out from Firebase
      await signOutUser();
      
      // Clear user state immediately
      setUser(null);
      setToken(null);
      
      // Force a complete page reload to clear any cached state
      window.location.replace('/auth/signIn');
    } catch (error: unknown) {
      console.error('Sign out error:', error);
      
      // Even if Firebase sign out fails, clear local state and redirect
      setUser(null);
      setToken(null);
      localStorage.clear(); // Clear all localStorage as a last resort
      window.location.replace('/auth/signIn');
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send password reset email');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogleProvider,
    signOut,
    resetUserPassword,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Legacy compatibility functions
export function useAuthLegacy() {
  async function signInWithCredentials({
    email,
    password,
    callbackUrl = '/app/dashboard',
    redirect = true,
  }: {
    email: string;
    password: string;
    callbackUrl?: string;
    redirect?: boolean;
  }) {
    try {
      await signInWithEmail(email, password);
      if (redirect) {
        window.location.href = callbackUrl;
      }
      return { success: true };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Invalid email or password');
    }
  }

  return { signInWithCredentials };
}