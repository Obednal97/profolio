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
  userProfile: { name: string; email: string; phone?: string; photoURL?: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogleProvider: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  token: string | null;
  refreshUserProfile: () => Promise<void>;
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

    // First, check if we already have a profile for this user
    const { apiCall } = await import('./mockApi');
    const existingProfileResponse = await apiCall('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        method: 'GET_PROFILE_FROM_STORAGE',
        userId: user.uid
      }),
    });
    
    const existingData = await existingProfileResponse.json();
    
    // If user already has a profile with data, don't overwrite it
    if (existingData.user && existingData.user.name) {
      console.log('✅ User profile already exists, skipping Google data import');
      return;
    }

    // Only save Google data for new users (first sign-up)
    console.log('🆕 New user detected, saving Google profile data');
    
    const profileData = {
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      phone: user.phoneNumber || '',
      photoURL: user.photoURL || '',
      provider: 'google',
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      lastUpdated: Date.now(),
    };

    await apiCall('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        method: 'UPDATE_PROFILE',
        userId: user.uid,
        profileData
      }),
    });

    console.log('✅ Google profile data saved for new user:', user.uid);
  } catch (error) {
    console.error('❌ Failed to persist Google profile data:', error);
    // Don't throw - this shouldn't break the auth flow
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; phone?: string; photoURL?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        // Make sure we're in the browser before setting up Firebase listeners
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        // Add a small delay to ensure proper hydration
        await new Promise(resolve => setTimeout(resolve, 100));

        unsubscribe = await onAuthStateChange(async (user) => {
          console.log('🔄 [Auth] Firebase auth state changed:', {
            hasUser: !!user,
            userId: user?.uid,
            email: user?.email,
            displayName: user?.displayName
          });
          
          setUser(user);
          
          if (user) {
            // Extract and persist Google profile data if this is a Google sign-in
            try {
              await extractAndPersistGoogleProfile(user);
            } catch (error) {
              console.warn('Failed to extract Google profile:', error);
            }
            
            // Fetch user profile from database
            try {
              await fetchUserProfile(user.uid);
            } catch (error) {
              console.warn('Failed to fetch user profile:', error);
              // Fallback to Firebase user data
              setUserProfile({
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                phone: user.phoneNumber || '',
                photoURL: user.photoURL || ''
              });
            }
            
            // Get and store the user token
            try {
              const userToken = await getUserToken();
              setToken(userToken);
              if (userToken) {
                localStorage.setItem('userToken', userToken);
              }
            } catch (tokenError) {
              console.warn('Failed to get user token:', tokenError);
              setToken(null);
            }
          } else {
            console.log('❌ [Auth] No Firebase user, clearing profile');
            setUserProfile(null);
            setToken(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('userToken');
            }
          }
          
          setLoading(false);
        });
        
        setInitError(null);
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize authentication');
        setLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error during auth cleanup:', error);
        }
      }
    };
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔄 [Auth] Fetching user profile for:', userId);
      const { apiCall } = await import('./mockApi');
      const response = await apiCall('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: 'GET_PROFILE',
          userId: userId
        }),
      });
      
      const data = await response.json();
      
      if (data.user) {
        const newProfile = {
          name: data.user.name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || '',
          phone: data.user.phone || '',
          photoURL: data.user.photoURL || ''
        };
        console.log('✅ [Auth] Profile updated:', newProfile.name);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('❌ [Auth] Failed to fetch user profile:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
      console.log('✅ [Auth] Profile refresh completed');
    }
  };

  // If there's an initialization error, provide a fallback context
  if (initError) {
    console.warn('Auth initialization failed, providing fallback context:', initError);
    const fallbackValue: AuthContextType = {
      user: null,
      userProfile: null,
      loading: false,
      signIn: async () => { throw new Error('Authentication not available'); },
      signUp: async () => { throw new Error('Authentication not available'); },
      signInWithGoogleProvider: async (): Promise<UserCredential> => { 
        throw new Error('Authentication not available'); 
      },
      signOut: async () => { throw new Error('Authentication not available'); },
      resetUserPassword: async () => { throw new Error('Authentication not available'); },
      token: null,
      refreshUserProfile: async () => { throw new Error('Authentication not available'); },
    };

    return (
      <AuthContext.Provider value={fallbackValue}>
        {children}
      </AuthContext.Provider>
    );
  }

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
      const userCredential = await signUpWithEmail(email, password, displayName);
      
      // Save initial profile data for email sign-ups
      if (userCredential.user) {
        const { apiCall } = await import('./mockApi');
        const profileData = {
          name: displayName || email.split('@')[0] || 'User',
          email: email,
          phone: '',
          photoURL: '',
          provider: 'email',
          emailVerified: false,
          createdAt: new Date().toISOString(),
          lastSignIn: new Date().toISOString(),
          lastUpdated: Date.now(),
        };

        await apiCall('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            method: 'UPDATE_PROFILE',
            userId: userCredential.user.uid,
            profileData
          }),
        });
        
        console.log('✅ Initial profile created for email user:', userCredential.user.uid);
      }
      
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
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogleProvider,
    signOut,
    resetUserPassword,
    token,
    refreshUserProfile,
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