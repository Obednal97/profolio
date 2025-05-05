import { useEffect, useState } from 'react';

interface SignUpParams {
  name: string;
  email: string;
  password: string;
  callbackUrl?: string;
  redirect?: boolean;
}

export function useAuth() {
  return {
    signUpWithCredentials: async ({ name, email, password }: SignUpParams) => {
      // TEMP stub
      console.log("Signup payload", { name, email, password });
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(res => res.ok ? res.json() : null)
      .then(setUser);
  }, []);

  return { data: user };
}