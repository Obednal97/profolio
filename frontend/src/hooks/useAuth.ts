import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirebase } from '../lib/firebase';
import { useEffect, useState } from 'react';

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
}

export function useAuth() {
  return {
    signUpWithCredentials: async ({ name, email, password }: SignUpParams) => {
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
      await fetch("/api/signout", { method: "POST" });
      if (redirect) {
        window.location.href = callbackUrl;
      }
    },
  };
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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