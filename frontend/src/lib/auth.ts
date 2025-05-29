'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
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
  signInWithGoogleProvider: () => Promise<void>;
  signOut: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        unsubscribe = await onAuthStateChange(async (user) => {
          setUser(user);
          
          if (user) {
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
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      await signUpWithEmail(email, password, displayName);
      // User state will be updated by the auth listener
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const signInWithGoogleProvider = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // User state will be updated by the auth listener
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      router.push('/auth/signIn');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
  const router = useRouter();

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
        router.push(callbackUrl);
      }
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Invalid email or password');
    }
  }

  return { signInWithCredentials };
}