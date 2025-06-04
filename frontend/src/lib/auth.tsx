"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, UserCredential } from "firebase/auth";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  onAuthStateChange,
  getUserToken,
} from "./firebase";

interface AuthContextType {
  user: User | null;
  userProfile: {
    name: string;
    email: string;
    phone?: string;
    photoURL?: string;
  } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signInWithGoogleProvider: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  token: string | null;
  refreshUserProfile: () => Promise<void>;
  checkTokenExpiration: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SECURITY FIX: Remove client-side token management to prevent XSS vulnerabilities
// All tokens are now managed server-side via httpOnly cookies set by API routes

// Secure user preferences storage (non-sensitive data only)
function getAuthPreferences(): { tokenExpiration?: string } {
  if (typeof window !== "undefined") {
    try {
      const prefs = sessionStorage.getItem("auth-preferences");
      return prefs ? JSON.parse(prefs) : {};
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to parse auth preferences:", error);
      }
      return {};
    }
  }
  return {};
}

// Configuration for token expiration
const TOKEN_EXPIRATION_CONFIG = {
  cloud: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  selfHosted: {
    default: 30 * 24 * 60 * 60 * 1000, // 30 days default
    options: {
      "1day": 24 * 60 * 60 * 1000,
      "7days": 7 * 24 * 60 * 60 * 1000,
      "30days": 30 * 24 * 60 * 60 * 1000,
      unlimited: 0,
    },
  },
};

// Check if we're in cloud mode (you can adjust this logic based on your deployment)
const isCloudMode = () => {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname.includes(".vercel.app") ||
    window.location.hostname.includes(".netlify.app") ||
    process.env.NODE_ENV === "production"
  );
};

// Global function to handle API response errors
const handleApiError = (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    if (process.env.NODE_ENV === "development") {
      console.warn("🔒 [Auth] Received 401/403, triggering automatic sign out");
    }
    // Trigger sign out event
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    return true;
  }
  return false;
};

// Helper function to extract and persist Google profile data
async function extractAndPersistGoogleProfile(user: User) {
  try {
    // Check if this is a Google sign-in
    const isGoogleProvider = user.providerData?.some(
      (provider) => provider.providerId === "google.com"
    );

    if (!isGoogleProvider) {
      return; // Not a Google sign-in, skip
    }

    if (process.env.NODE_ENV === "development") {
      console.log("🆕 Google sign-in detected, saving profile data");
    }

    const profileData = {
      name: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email || "",
      phone: user.phoneNumber || "",
      photoURL: user.photoURL || "",
      provider: "firebase",
      emailVerified: user.emailVerified,
      lastSignIn: new Date().toISOString(),
    };

    // Get Firebase token and exchange it for backend JWT via secure API route
    const firebaseToken = await user.getIdToken();
    const backendToken = await exchangeFirebaseTokenForBackendJWT(
      firebaseToken
    );

    if (!backendToken) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to exchange Firebase token for backend JWT");
      }
      return;
    }

    // SECURITY: Use server-side authentication - backend token is handled by API route
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify(profileData),
      credentials: "include", // Include httpOnly cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Failed to save Google profile to database:",
          errorData.message || response.statusText
        );
      }
      return; // Don't throw - this shouldn't break the auth flow
    }

    const data = await response.json();

    if (data.success) {
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Google profile data saved for user:", user.uid);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn("❌ Failed to save Google profile:", data.message);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Failed to persist Google profile data:", error);
    }
    // Don't throw - this shouldn't break the auth flow
  }
}

// Helper function to exchange Firebase token for backend JWT
async function exchangeFirebaseTokenForBackendJWT(
  firebaseToken: string
): Promise<string | null> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 Exchanging Firebase token for backend JWT...");
    }

    // SECURITY: Server-side token exchange sets httpOnly cookies
    const response = await fetch("/api/auth/firebase-exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firebaseToken }),
      credentials: "include", // Include httpOnly cookies in response
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (process.env.NODE_ENV === "development") {
        console.error(
          "Token exchange failed:",
          errorData.message || response.statusText
        );
      }
      return null;
    }

    const data = await response.json();

    if (data.success && data.token) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ Firebase token exchanged for backend JWT (stored as httpOnly cookie)"
        );
      }
      // SECURITY: Return token for immediate use, but don't store client-side
      // Server has set httpOnly cookie for future requests
      return data.token;
    } else {
      if (process.env.NODE_ENV === "development") {
        console.error("Token exchange failed: No token in response");
      }
      return null;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Token exchange error:", error);
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    phone?: string;
    photoURL?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Handle automatic sign out on unauthorized responses
  const handleUnauthorized = useCallback(async () => {
    if (process.env.NODE_ENV === "development") {
      console.warn("🔒 [Auth] Handling unauthorized access, signing out user");
    }
    await signOut();
  }, []);

  // Check token expiration based on mode and settings
  const checkTokenExpiration = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // SECURITY: Use secure API route that checks httpOnly cookies server-side
      const response = await fetch("/api/auth/profile", {
        method: "GET",
        credentials: "include", // Include httpOnly cookies
      });

      if (handleApiError(response)) {
        return false;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user?.lastSignIn) {
          const lastSignIn = new Date(data.user.lastSignIn);
          const now = new Date();
          const timeDiff = now.getTime() - lastSignIn.getTime();

          let expirationTime: number;

          if (isCloudMode()) {
            // Cloud mode: 30 days fixed
            expirationTime = TOKEN_EXPIRATION_CONFIG.cloud;
          } else {
            // Self-hosted mode: check user preferences or use default
            const authPrefs = getAuthPreferences();
            const userTokenExpiration = authPrefs.tokenExpiration || "30days";
            expirationTime =
              TOKEN_EXPIRATION_CONFIG.selfHosted.options[
                userTokenExpiration as keyof typeof TOKEN_EXPIRATION_CONFIG.selfHosted.options
              ] || TOKEN_EXPIRATION_CONFIG.selfHosted.default;
          }

          // If unlimited (0), never expire
          if (expirationTime === 0) return true;

          // Check if token has expired
          if (timeDiff > expirationTime) {
            if (process.env.NODE_ENV === "development") {
              console.warn("🕐 [Auth] Token expired, signing out user");
            }
            await signOut();
            return false;
          }

          return true;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Token expiration check error:", error);
      }
    }

    return false;
  }, [user]);

  useEffect(() => {
    // Listen for unauthorized events
    const handleUnauthorizedEvent = () => {
      handleUnauthorized();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorizedEvent);

    // Check token expiration periodically (every 5 minutes)
    const tokenCheckInterval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorizedEvent);
      clearInterval(tokenCheckInterval);
    };
  }, [handleUnauthorized, checkTokenExpiration]);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("🔄 [Auth] Fetching user profile for:", userId);
        }

        // Get current user to obtain token
        const currentUser = user;
        if (!currentUser) {
          throw new Error("No authenticated user found");
        }

        // Always get fresh Firebase token
        const firebaseToken = await currentUser.getIdToken(); // Get fresh token

        // Try to exchange Firebase token for backend JWT
        const backendToken = await exchangeFirebaseTokenForBackendJWT(
          firebaseToken
        );

        if (!backendToken) {
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ [Auth] Failed to exchange Firebase token");
          }
          throw new Error("No authentication token available");
        }

        // SECURITY: Use server-side authentication with httpOnly cookies
        const response = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${backendToken}`,
          },
          credentials: "include", // Include httpOnly cookies
        });

        if (!response.ok) {
          // If token is invalid, try to get a fresh one
          if (response.status === 401) {
            if (process.env.NODE_ENV === "development") {
              console.log("🔄 [Auth] Token expired, getting fresh token...");
            }
            const freshFirebaseToken = await currentUser.getIdToken();
            const freshBackendToken = await exchangeFirebaseTokenForBackendJWT(
              freshFirebaseToken
            );

            if (freshBackendToken) {
              // Retry the request with fresh token
              const retryResponse = await fetch("/api/auth/profile", {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${freshBackendToken}`,
                },
                credentials: "include",
              });

              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.success && retryData.user) {
                  const newProfile = {
                    name:
                      retryData.user.name ||
                      retryData.user.email?.split("@")[0] ||
                      "User",
                    email: retryData.user.email || "",
                    phone: retryData.user.phone || "",
                    photoURL: retryData.user.photoURL || "",
                  };
                  if (process.env.NODE_ENV === "development") {
                    console.log(
                      "✅ [Auth] Profile updated with fresh token:",
                      newProfile.name
                    );
                  }
                  setUserProfile(newProfile);
                  return;
                }
              }
            }
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success && data.user) {
          const newProfile = {
            name: data.user.name || data.user.email?.split("@")[0] || "User",
            email: data.user.email || "",
            phone: data.user.phone || "",
            photoURL: data.user.photoURL || "",
          };
          if (process.env.NODE_ENV === "development") {
            console.log("✅ [Auth] Profile updated:", newProfile.name);
          }
          setUserProfile(newProfile);
        } else {
          // Fallback to Firebase user data
          setUserProfile({
            name:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "User",
            email: currentUser.email || "",
            phone: currentUser.phoneNumber || "",
            photoURL: currentUser.photoURL || "",
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ [Auth] Failed to fetch user profile:", error);
        }
        // Fallback to Firebase user data
        if (user) {
          setUserProfile({
            name: user.displayName || user.email?.split("@")[0] || "User",
            email: user.email || "",
            phone: user.phoneNumber || "",
            photoURL: user.photoURL || "",
          });
        }
        throw error;
      }
    },
    [user]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        // Make sure we're in the browser before setting up Firebase listeners
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        // Add a small delay to ensure proper hydration
        await new Promise((resolve) => setTimeout(resolve, 100));

        unsubscribe = await onAuthStateChange(async (user) => {
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 [Auth] Firebase auth state changed:", {
              hasUser: !!user,
              userId: user?.uid,
              email: user?.email,
              displayName: user?.displayName,
            });
          }

          setUser(user);

          if (user) {
            // Extract and persist Google profile data if this is a Google sign-in
            try {
              await extractAndPersistGoogleProfile(user);
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.warn("Failed to extract Google profile:", error);
              }
            }

            // Fetch user profile from database
            try {
              await fetchUserProfile(user.uid);
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.warn("Failed to fetch user profile:", error);
              }
              // Fallback to Firebase user data
              setUserProfile({
                name: user.displayName || user.email?.split("@")[0] || "User",
                email: user.email || "",
                phone: user.phoneNumber || "",
                photoURL: user.photoURL || "",
              });
            }

            // Get and store the user token (Firebase token for immediate use)
            try {
              const userToken = await getUserToken();
              setToken(userToken);
              // SECURITY: No client-side token storage - server manages httpOnly cookies
            } catch (tokenError) {
              if (process.env.NODE_ENV === "development") {
                console.warn("Failed to get user token:", tokenError);
              }
              setToken(null);
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("❌ [Auth] No Firebase user, clearing profile");
            }
            setUserProfile(null);
            setToken(null);
            // SECURITY: Server-side logout clears httpOnly cookies
          }

          setLoading(false);
        });

        setInitError(null);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error setting up auth listener:", error);
        }
        setInitError(
          error instanceof Error
            ? error.message
            : "Failed to initialize authentication"
        );
        setLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Error during auth cleanup:", error);
          }
        }
      }
    };
  }, [fetchUserProfile]);

  const refreshUserProfile = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ [Auth] Profile refresh completed");
      }
    }
  };

  // If there's an initialization error, provide a fallback context
  if (initError) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Auth initialization failed, providing fallback context:",
        initError
      );
    }
    const fallbackValue: AuthContextType = {
      user: null,
      userProfile: null,
      loading: false,
      signIn: async () => {
        throw new Error("Authentication not available");
      },
      signUp: async () => {
        throw new Error("Authentication not available");
      },
      signInWithGoogleProvider: async (): Promise<UserCredential> => {
        throw new Error("Authentication not available");
      },
      signOut: async () => {
        throw new Error("Authentication not available");
      },
      resetUserPassword: async () => {
        throw new Error("Authentication not available");
      },
      token: null,
      refreshUserProfile: async () => {
        throw new Error("Authentication not available");
      },
      checkTokenExpiration: async () => {
        throw new Error("Authentication not available");
      },
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
      throw new Error(
        error instanceof Error ? error.message : "Failed to sign in"
      );
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      setLoading(true);
      const userCredential = await signUpWithEmail(
        email,
        password,
        displayName
      );

      // Save initial profile data for email sign-ups
      if (userCredential.user) {
        const profileData = {
          name: displayName || email.split("@")[0] || "User",
          email: email,
          phone: "",
          photoURL: "",
          provider: "firebase",
          emailVerified: false,
          lastSignIn: new Date().toISOString(),
        };

        try {
          // Get Firebase token to authenticate with backend
          const token = await userCredential.user.getIdToken();

          // SECURITY: Use server-side authentication with httpOnly cookies
          const response = await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              console.log(
                "✅ Initial profile created for email user:",
                userCredential.user.uid
              );
            }
          }
        } catch (profileError) {
          console.warn(
            "Failed to save initial profile for email user:",
            profileError
          );
          // Don't fail the entire sign-up process if profile save fails
        }
      }

      // User state will be updated by the auth listener
    } catch (error: unknown) {
      setLoading(false);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create account"
      );
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
      throw new Error(
        error instanceof Error ? error.message : "Failed to sign in with Google"
      );
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Check if we're in demo mode and handle it properly
      if (typeof window !== "undefined") {
        const { DemoSessionManager } = await import("@/lib/demoSession");
        if (DemoSessionManager.isDemoMode()) {
          console.log("Demo mode: Ending demo session");
          DemoSessionManager.endDemoSession();
          // endDemoSession() handles redirect automatically
          return;
        }
      }

      // SECURITY: Call server-side logout to clear httpOnly cookies
      try {
        await fetch("/api/auth/signout", {
          method: "POST",
          credentials: "include",
        });
      } catch (logoutError) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Server-side logout failed:", logoutError);
        }
      }

      // Clear any demo mode data
      localStorage.removeItem("demo-mode");
      localStorage.removeItem("user-data");
      localStorage.removeItem("demo-api-keys");

      // Clear any Firebase auth-related localStorage items (without hardcoded keys)
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("firebase:authUser:") ||
          key.startsWith("firebase:")
        ) {
          localStorage.removeItem(key);
        }
      });

      // Sign out from Firebase
      await signOutUser();

      // Clear user state immediately
      setUser(null);
      setToken(null);

      // Force a complete page reload to clear any cached state
      window.location.replace("/auth/signIn");
    } catch (error: unknown) {
      console.error("Sign out error:", error);

      // Even if Firebase sign out fails, clear local state and redirect
      setUser(null);
      setToken(null);
      localStorage.clear(); // Clear all localStorage as a last resort
      window.location.replace("/auth/signIn");
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to send password reset email"
      );
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
    checkTokenExpiration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Legacy compatibility functions
export function useAuthLegacy() {
  async function signInWithCredentials({
    email,
    password,
    callbackUrl = "/app/dashboard",
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
      throw new Error(
        error instanceof Error ? error.message : "Invalid email or password"
      );
    }
  }

  return { signInWithCredentials };
}
