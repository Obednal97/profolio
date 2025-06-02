import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebase } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { initializeDemoData } from '@/lib/demoData';
import { DemoSessionManager } from '@/lib/demoSession';

// Development bypass flag - set to false for proper authentication
const BYPASS_AUTH = false;

interface SignUpParams {
  name: string;
  email: string;
  password: string;
  callbackUrl?: string;
  redirect?: boolean;
}

interface User {
  id: string;
  email: string | null;
  token?: string;
  name?: string;
}

// Demo user for development
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@profolio.com',
  token: 'demo-token-secure-123',
  name: 'Demo User'
};

export function useAuth() {
  return {
    signUpWithCredentials: async ({ name, email, password, callbackUrl, redirect }: SignUpParams) => {
      if (BYPASS_AUTH) {
        // Mock signup for development
        console.log('Dev mode: Mock signup', { name, email });
        if (redirect && callbackUrl) {
          window.location.href = callbackUrl;
        }
        return;
      }
      
      const firebase = await getFirebase();
      const auth = firebase.auth!;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsubscribe();
            resolve(true);
          }
        });
      });
      await new Promise((r) => setTimeout(r, 150));
    },
    
    // Demo mode function
    signInWithDemo: async ({ callbackUrl = '/app/dashboard', redirect = true } = {}) => {
      console.log('Demo mode: Creating demo user session with 24-hour expiration');
      
      try {
        // Start demo session (now synchronous)
        const sessionStarted = DemoSessionManager.startDemoSession();
        
        if (!sessionStarted) {
          throw new Error('Failed to start demo session');
        }
        
        // Store demo user token for API calls
        localStorage.setItem('auth-token', DEMO_USER.token!);
        
        // Store demo user data
        localStorage.setItem('user-data', JSON.stringify(DEMO_USER));
        
        // Populate demo data
        try {
          await initializeDemoData();
          console.log('Demo data populated successfully');
        } catch (error) {
          console.error('Failed to populate demo data:', error);
          // Don't fail the demo login if data population fails
        }
        
        if (redirect) {
          console.log('Demo mode setup complete, redirecting to:', callbackUrl);
          window.location.href = callbackUrl;
        }
        
        return { success: true, user: DEMO_USER };
      } catch (error) {
        console.error('Demo mode setup failed:', error);
        throw error;
      }
    },
    
    signOut: async ({ callbackUrl = "/", redirect = true } = {}) => {
      if (BYPASS_AUTH) {
        console.log('Dev mode: Mock signout');
        if (redirect) {
          window.location.href = callbackUrl;
        }
        return;
      }
      
      // Check if we're in demo mode and handle it properly
      if (DemoSessionManager.isDemoMode()) {
        console.log('Demo mode: Ending demo session');
        DemoSessionManager.endDemoSession();
        // endDemoSession() handles redirect automatically
        return;
      }
      
      // Clear all authentication-related localStorage items
      localStorage.removeItem('auth-token');
      localStorage.removeItem('demo-mode');
      localStorage.removeItem('user-data');
      localStorage.removeItem('demo-api-keys');
      localStorage.removeItem('userToken');
      
      // Clear any Firebase auth cache
      const firebaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('firebase:') || key.includes('authUser')
      );
      firebaseKeys.forEach(key => localStorage.removeItem(key));
      
      // Sign out from Firebase if available
      try {
        const { getFirebase } = await import('@/lib/firebase');
        const { auth } = await getFirebase();
        if (auth) {
          await firebaseSignOut(auth);
        }
      } catch (error) {
        console.error('Firebase sign out error:', error);
      }
      
      // Call backend signout endpoint
      try {
        await fetch("/api/signout", { method: "POST" });
      } catch (error) {
        console.error('Backend signout error:', error);
      }
      
      if (redirect) {
        // Use replace to prevent back button issues
        window.location.replace(callbackUrl);
      }
    },
    forceLogout: async () => {
      if (BYPASS_AUTH) {
        console.log('Dev mode: Mock force logout');
        return;
      }
      
      // Clear demo mode data and API keys
      localStorage.removeItem('auth-token');
      localStorage.removeItem('demo-mode');
      localStorage.removeItem('user-data');
      localStorage.removeItem('demo-api-keys'); // Clear demo API keys
      
      const auth = (await getFirebase()).auth!;
      await firebaseSignOut(auth);
    },
  };
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo session validity first
    const demoSession = DemoSessionManager.checkDemoSession();
    if (demoSession.isValid) {
      const userData = localStorage.getItem('user-data');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing demo user data:', error);
          // Clear corrupted demo data
          DemoSessionManager.endDemoSession();
        }
      }
    }

    if (BYPASS_AUTH) {
      // Return mock user for development
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    let unsubscribe: () => void;

    const initAuth = async () => {
      const auth = (await getFirebase()).auth!;
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          const userObj = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            token,
            name: firebaseUser.displayName || undefined,
          };
          setUser(userObj);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { data: user, loading };
}