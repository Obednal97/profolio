import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
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
    signInWithCredentials: async ({ email, password }: { email: string; password: string }) => {
      // TEMP stub
      console.log("Signin payload", { email, password });
    },
    signUpWithCredentials: async ({ name, email, password }: SignUpParams) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      if (userCredential.user) {
        const token = await userCredential.user.getIdToken();
        console.log("Signup successful. Token:", token);
      }
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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

    return () => unsubscribe();
  }, []);

  return { data: user, loading };
}