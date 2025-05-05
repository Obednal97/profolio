// src/hooks/useAuth.ts
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
  return {
    data: null, // TEMP: simulate unauthenticated
  };
}