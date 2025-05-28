import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebase } from '../lib/firebase';
import { useEffect, useState } from 'react';

// Development bypass flag - set to true to bypass authentication
const BYPASS_AUTH = true;

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
  token: string;
  name?: string;
}

// Mock user for development
const MOCK_USER: User = {
  id: 'dev-user-123',
  email: 'dev@profolio.com',
  token: 'dev-token-123',
  name: 'Dev User'
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
    signOut: async ({ callbackUrl = "/", redirect = true } = {}) => {
      if (BYPASS_AUTH) {
        console.log('Dev mode: Mock signout');
        if (redirect) {
          window.location.href = callbackUrl;
        }
        return;
      }
      
      await fetch("/api/signout", { method: "POST" });
      if (redirect) {
        window.location.href = callbackUrl;
      }
    },
    forceLogout: async () => {
      if (BYPASS_AUTH) {
        console.log('Dev mode: Mock force logout');
        return;
      }
      
      const auth = (await getFirebase()).auth!;
      await firebaseSignOut(auth);
    },
  };
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (BYPASS_AUTH) {
      // Return mock user for development
      setUser(MOCK_USER);
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