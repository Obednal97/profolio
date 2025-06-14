import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebase } from "../lib/firebase";
import { useEffect, useState } from "react";
import { initializeDemoData } from "@/lib/demoData";
import { DemoSessionManager } from "@/lib/demoSession";

// Development bypass flag - environment-based for development testing
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

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

// Generate secure demo session token
function generateDemoSessionToken(): string {
  const timestamp = Date.now().toString();
  const randomId =
    crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
  return `demo-${timestamp}-${randomId}`;
}

// Demo user factory for secure dynamic generation
function createDemoUser(): User {
  return {
    id: "demo-user-id",
    email: "demo@profolio.com",
    token: generateDemoSessionToken(),
    name: "Demo User",
  };
}

// Secure demo data storage (sessionStorage for demo tokens)
function storeDemoUserData(user: User): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("demo-auth-token", user.token || "");
    sessionStorage.setItem("demo-user-data", JSON.stringify(user));
  }
}

function getDemoUserData(): User | null {
  if (typeof window !== "undefined") {
    try {
      const userData = sessionStorage.getItem("demo-user-data");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error parsing demo user data:", error);
      }
      return null;
    }
  }
  return null;
}

function clearDemoUserData(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("demo-auth-token");
    sessionStorage.removeItem("demo-user-data");
  }
}

export function useAuth() {
  return {
    signUpWithCredentials: async ({
      name,
      email,
      password,
      callbackUrl,
      redirect,
    }: SignUpParams) => {
      if (BYPASS_AUTH) {
        // Mock signup for development
        if (process.env.NODE_ENV === "development") {
          console.log("Dev mode: Mock signup", { name, email });
        }
        if (redirect && callbackUrl) {
          window.location.href = callbackUrl;
        }
        return;
      }

      const firebase = await getFirebase();
      const auth = firebase.auth!;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
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

    // Demo mode function with secure token generation
    signInWithDemo: async ({
      callbackUrl = "/app/dashboard",
      redirect = true,
    } = {}) => {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Demo mode: Creating demo user session with 24-hour expiration"
        );
      }

      try {
        // Start demo session (now synchronous)
        const sessionStarted = DemoSessionManager.startDemoSession();

        if (!sessionStarted) {
          throw new Error("Failed to start demo session");
        }

        // Create demo user with dynamic token
        const demoUser = createDemoUser();

        // Store demo user data securely
        storeDemoUserData(demoUser);

        // Populate demo data
        try {
          await initializeDemoData();
          if (process.env.NODE_ENV === "development") {
            console.log("Demo data populated successfully");
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to populate demo data:", error);
          }
          // Don't fail the demo login if data population fails
        }

        if (redirect) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "Demo mode setup complete, redirecting to:",
              callbackUrl
            );
          }
          window.location.href = callbackUrl;
        }

        return { success: true, user: demoUser };
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Demo mode setup failed:", error);
        }
        throw error;
      }
    },

    signOut: async ({ callbackUrl = "/", redirect = true } = {}) => {
      if (BYPASS_AUTH) {
        if (process.env.NODE_ENV === "development") {
          console.log("Dev mode: Mock signout");
        }
        if (redirect) {
          window.location.href = callbackUrl;
        }
        return;
      }

      // Check if we're in demo mode and handle it properly
      if (DemoSessionManager.isDemoMode()) {
        if (process.env.NODE_ENV === "development") {
          console.log("Demo mode: Ending demo session");
        }
        DemoSessionManager.endDemoSession();
        // endDemoSession() handles redirect automatically
        return;
      }

      // Clear secure authentication data
      clearDemoUserData();
      document.cookie =
        "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict";

      // Clear legacy localStorage items (cleanup)
      localStorage.removeItem("demo-mode");
      localStorage.removeItem("user-data");
      localStorage.removeItem("demo-api-keys");
      localStorage.removeItem("userToken");

      // Clear any Firebase auth cache
      const firebaseKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("firebase:") || key.includes("authUser")
      );
      firebaseKeys.forEach((key) => localStorage.removeItem(key));

      // Sign out from Firebase if available
      try {
        const { getFirebase } = await import("@/lib/firebase");
        const { auth } = await getFirebase();
        if (auth) {
          await firebaseSignOut(auth);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Firebase sign out error:", error);
        }
      }

      // Call backend signout endpoint
      try {
        await fetch("/api/signout", { method: "POST" });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Backend signout error:", error);
        }
      }

      if (redirect) {
        // Use replace to prevent back button issues
        window.location.replace(callbackUrl);
      }
    },

    forceLogout: async () => {
      if (BYPASS_AUTH) {
        if (process.env.NODE_ENV === "development") {
          console.log("Dev mode: Mock force logout");
        }
        return;
      }

      // Clear demo mode data securely
      clearDemoUserData();
      document.cookie =
        "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict";
      localStorage.removeItem("demo-mode");
      localStorage.removeItem("user-data");
      localStorage.removeItem("demo-api-keys");

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
      const userData = getDemoUserData();
      if (userData) {
        setUser(userData);
        setLoading(false);
        return;
      } else {
        // Clear corrupted demo data
        DemoSessionManager.endDemoSession();
      }
    }

    if (BYPASS_AUTH) {
      // Return mock user for development
      const demoUser = createDemoUser();
      setUser(demoUser);
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
