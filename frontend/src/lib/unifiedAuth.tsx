"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { getAuthConfig, AuthConfig } from "./authConfig";
import { LocalUser, localAuth } from "./localAuth";

// Firebase User type (minimal interface for what we need)
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

// Unified user interface that works for both Firebase and local users
export interface UnifiedUser {
  id: string;
  email: string | null;
  name?: string | null;
  token?: string | null;
  // Firebase compatibility
  uid?: string;
  displayName?: string | null;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
}

interface UnifiedAuthContextType {
  user: UnifiedUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authMode: AuthConfig["mode"];
  config: AuthConfig | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signInWithGoogleProvider?: () => Promise<unknown>;
  signOut: () => Promise<void>;
  resetUserPassword?: (email: string) => Promise<void>;
  signInWithDemo: () => Promise<void>;
  token: string | null;
  refreshUserProfile: () => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | null>(null);

// SECURITY FIX: Remove global token cache to prevent XSS vulnerabilities
// All tokens are now managed server-side via httpOnly cookies set by API routes

// Convert LocalUser to UnifiedUser
function localUserToUnified(localUser: LocalUser): UnifiedUser {
  return {
    id: localUser.id,
    uid: localUser.id, // Firebase compatibility
    email: localUser.email,
    name: localUser.name,
    displayName: localUser.name, // Firebase compatibility
    token: localUser.token,
  };
}

// Convert Firebase User to UnifiedUser
function firebaseUserToUnified(firebaseUser: FirebaseUser): UnifiedUser {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName,
    displayName: firebaseUser.displayName,
    token: null, // Will be set separately
  };
}

// SECURITY FIX: Remove client-side token management to prevent XSS vulnerabilities
// All tokens are now managed server-side via httpOnly cookies set by API routes

export function UnifiedAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [authMode, setAuthMode] = useState<AuthConfig["mode"]>("local");

  // Use refs for cancellation and mounted state
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const profileFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track component lifecycle
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (profileFetchTimeoutRef.current) {
        clearTimeout(profileFetchTimeoutRef.current);
      }
    };
  }, []);

  // Get backend token from Firebase token (SECURITY: Server-side token exchange)
  const getBackendTokenFromFirebase = useCallback(async (): Promise<
    string | null
  > => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // DEVELOPMENT MODE: Only skip backend API calls if explicitly disabled
      if (
        process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_ENABLE_API_PROXY === "false"
      ) {
        console.log(
          "🔧 [Auth] Development mode: Backend API calls explicitly disabled, using Firebase token directly"
        );

        // Use Firebase token directly only when explicitly disabled
        const { getFirebaseAuth } = await import("./firebase");
        const auth = await getFirebaseAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
          const firebaseToken = await currentUser.getIdToken();
          // SECURITY: No client-side storage - return token for immediate use only
          return firebaseToken;
        }

        return null;
      }

      // Default behavior: Always attempt JWT token exchange for proper authentication
      console.log("🔄 [Auth] Attempting JWT token exchange...");

      // Get Firebase token
      const { getFirebaseAuth } = await import("./firebase");
      const auth = await getFirebaseAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No current Firebase user");
      }

      const firebaseToken = await currentUser.getIdToken();

      // SECURITY: Server-side token exchange sets httpOnly cookies
      const exchangeResponse = await fetch("/api/auth/firebase-exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firebaseToken }),
        credentials: "include", // Include httpOnly cookies in response
        signal: abortControllerRef.current.signal,
      });

      if (!exchangeResponse.ok) {
        throw new Error(`Token exchange failed: ${exchangeResponse.status}`);
      }

      const data = await exchangeResponse.json();
      if (data.success && data.token) {
        console.log(
          "✅ [Auth] JWT token exchange successful (stored as httpOnly cookie)"
        );
        // SECURITY: Return token for immediate use, but don't store client-side
        // Server has set httpOnly cookie for future requests
        return data.token;
      }

      throw new Error("Invalid token exchange response");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.warn(
          "Firebase token exchange failed, using Firebase token directly:",
          error
        );

        // FALLBACK: Use Firebase token directly if backend exchange fails
        try {
          const { getFirebaseAuth } = await import("./firebase");
          const auth = await getFirebaseAuth();
          const currentUser = auth.currentUser;

          if (currentUser) {
            const firebaseToken = await currentUser.getIdToken();
            console.log("⚠️ [Auth] Using Firebase token as fallback");
            return firebaseToken;
          }
        } catch (fallbackError) {
          console.error("Firebase token fallback also failed:", fallbackError);
        }
      }
      return null;
    }
  }, []);

  // Optimized profile fetching with SECURITY: Server-side authentication
  const fetchUserProfileOptimized = useCallback(
    async (firebaseUser: FirebaseUser, backendToken: string) => {
      try {
        // DEVELOPMENT MODE: Only skip backend profile API calls if explicitly disabled
        if (
          process.env.NODE_ENV === "development" &&
          process.env.NEXT_PUBLIC_ENABLE_API_PROXY === "false"
        ) {
          console.log(
            "🔧 [Auth] Development mode: Backend API calls explicitly disabled, using Firebase profile data directly"
          );

          const fallbackProfile: UserProfile = {
            name:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            email: firebaseUser.email || "",
            phone: firebaseUser.phoneNumber || "",
            photoURL: firebaseUser.photoURL || "",
          };

          if (mountedRef.current) {
            setUserProfile(fallbackProfile);
          }
          return;
        }

        // Debounce profile fetches (wait 500ms before fetching)
        if (profileFetchTimeoutRef.current) {
          clearTimeout(profileFetchTimeoutRef.current);
        }

        profileFetchTimeoutRef.current = setTimeout(async () => {
          try {
            // SECURITY: Use server-side authentication with httpOnly cookies
            const profileResponse = await fetch("/api/auth/profile", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${backendToken}`,
                "Content-Type": "application/json",
              },
              credentials: "include", // Include httpOnly cookies
              signal:
                abortControllerRef.current?.signal ||
                new AbortController().signal,
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();

              if (profileData.success && profileData.user) {
                const newProfile: UserProfile = {
                  name:
                    profileData.user.name ||
                    firebaseUser.displayName ||
                    firebaseUser.email?.split("@")[0] ||
                    "User",
                  email: profileData.user.email || firebaseUser.email || "",
                  phone:
                    profileData.user.phone || firebaseUser.phoneNumber || "",
                  photoURL:
                    profileData.user.photoURL || firebaseUser.photoURL || "",
                };

                if (mountedRef.current) {
                  setUserProfile(newProfile);
                }
                return;
              }
            }

            // Fallback to Firebase data if backend fetch fails
            const fallbackProfile: UserProfile = {
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "User",
              email: firebaseUser.email || "",
              phone: firebaseUser.phoneNumber || "",
              photoURL: firebaseUser.photoURL || "",
            };

            if (mountedRef.current) {
              setUserProfile(fallbackProfile);
            }
          } catch (error) {
            if (error instanceof Error && error.name !== "AbortError") {
              console.warn("Profile fetch failed, using Firebase data:", error);

              const fallbackProfile: UserProfile = {
                name:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split("@")[0] ||
                  "User",
                email: firebaseUser.email || "",
                phone: firebaseUser.phoneNumber || "",
                photoURL: firebaseUser.photoURL || "",
              };

              if (mountedRef.current) {
                setUserProfile(fallbackProfile);
              }
            }
          }
        }, 500); // 500ms debounce
      } catch (error) {
        console.error("Profile fetch setup failed:", error);
      }
    },
    []
  );

  // Initialize authentication system
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // SECURITY: No client-side token initialization - server manages httpOnly cookies

    const initializeAuth = async () => {
      try {
        // Get auth configuration
        const authConfig = await getAuthConfig();
        setConfig(authConfig);
        setAuthMode(authConfig.mode);

        if (authConfig.mode === "local") {
          // Use local authentication
          unsubscribe = localAuth.onAuthStateChange((localUser) => {
            if (localUser) {
              const unifiedUser = localUserToUnified(localUser);
              setUser(unifiedUser);
              setToken(localUser.token);

              // Set user profile from local user data
              setUserProfile({
                name:
                  localUser.name || localUser.email?.split("@")[0] || "User",
                email: localUser.email,
                phone: "",
                photoURL: "",
              });
            } else {
              setUser(null);
              setToken(null);
              setUserProfile(null);
            }
            setLoading(false);
          });
        } else {
          // Use Firebase authentication (dynamic import to avoid errors when Firebase config is missing)
          try {
            const { onAuthStateChange, getUserToken } = await import(
              "./firebase"
            );

            unsubscribe = await onAuthStateChange(
              async (firebaseUser: FirebaseUser | null) => {
                if (firebaseUser) {
                  const unifiedUser = firebaseUserToUnified(firebaseUser);
                  setUser(unifiedUser);

                  // Get Firebase token (use for immediate operations)
                  try {
                    const userToken = await getUserToken();
                    setToken(userToken);
                  } catch (tokenError) {
                    console.warn("Failed to get Firebase token:", tokenError);
                  }

                  // SECURITY: Get backend token with secure server-side handling
                  const backendToken = await getBackendTokenFromFirebase();

                  if (backendToken) {
                    setToken(backendToken);

                    // Fetch profile with secure authentication
                    await fetchUserProfileOptimized(firebaseUser, backendToken);
                  } else {
                    // Token exchange failed, use Firebase data as fallback
                    const fallbackProfile: UserProfile = {
                      name:
                        firebaseUser.displayName ||
                        firebaseUser.email?.split("@")[0] ||
                        "User",
                      email: firebaseUser.email || "",
                      phone: firebaseUser.phoneNumber || "",
                      photoURL: firebaseUser.photoURL || "",
                    };

                    if (mountedRef.current) {
                      setUserProfile(fallbackProfile);
                    }
                  }
                } else {
                  setUser(null);
                  setToken(null);
                  setUserProfile(null);

                  // SECURITY: No client-side cache clearing needed - server manages cookies
                }
                setLoading(false);
              }
            );
          } catch (error) {
            console.error(
              "Firebase initialization failed, falling back to local auth:",
              error
            );
            // Fall back to local auth if Firebase fails
            setAuthMode("local");
            setConfig({
              ...authConfig,
              mode: "local",
              enableGoogleAuth: false,
            });

            unsubscribe = localAuth.onAuthStateChange((localUser) => {
              if (localUser) {
                const unifiedUser = localUserToUnified(localUser);
                setUser(unifiedUser);
                setToken(localUser.token);
                setUserProfile({
                  name:
                    localUser.name || localUser.email?.split("@")[0] || "User",
                  email: localUser.email,
                  phone: "",
                  photoURL: "",
                });
              } else {
                setUser(null);
                setToken(null);
                setUserProfile(null);
              }
              setLoading(false);
            });
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserProfileOptimized]); // getBackendTokenFromFirebase intentionally excluded - stable with no params

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (authMode === "local") {
        await localAuth.signIn(email, password);
      } else {
        const { signInWithEmail } = await import("./firebase");
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    setLoading(true);
    try {
      if (authMode === "local") {
        await localAuth.signUp(email, password, displayName);
      } else {
        const { signUpWithEmail } = await import("./firebase");
        await signUpWithEmail(email, password, displayName);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogleProvider =
    authMode === "firebase"
      ? async () => {
          setLoading(true);
          try {
            const { signInWithGoogle } = await import("./firebase");
            return await signInWithGoogle();
          } catch (error) {
            setLoading(false);
            throw error;
          }
        }
      : undefined;

  const signOut = async () => {
    setLoading(true);
    try {
      // Check for demo mode first and handle it properly
      if (typeof window !== "undefined") {
        const { DemoSessionManager } = await import("@/lib/demoSession");
        if (DemoSessionManager.isDemoMode()) {
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

      // Add signing out indicator for better UX
      const signOutUrl = "/auth/signIn?auth-action=signing-out";

      if (authMode === "local") {
        await localAuth.signOut();
      } else {
        const { signOutUser } = await import("./firebase");
        await signOutUser();
      }

      // Clear local state
      setUser(null);
      setToken(null);
      setUserProfile(null);

      // SECURITY: No client-side token clearing needed - server manages httpOnly cookies

      // Clear service worker auth cache to prevent cached auth state
      try {
        const { clearAuthCache } = await import("@/components/PWAManager");
        await clearAuthCache();
        console.log("🧹 Cleared auth cache during sign out");
      } catch (cacheError) {
        console.warn(
          "⚠️ Failed to clear auth cache during sign out:",
          cacheError
        );
      }

      // Redirect with signing out indicator
      window.location.replace(signOutUrl);
    } catch (error) {
      console.error("Sign out error:", error);
      // Force clear state even if sign out fails
      setUser(null);
      setToken(null);
      setUserProfile(null);

      // Still try to clear cache even if sign out failed
      try {
        const { clearAuthCache } = await import("@/components/PWAManager");
        await clearAuthCache();
      } catch (cacheError) {
        console.warn(
          "⚠️ Failed to clear auth cache after sign out error:",
          cacheError
        );
      }

      // Redirect even on error, with signing out indicator
      window.location.replace("/auth/signIn?auth-action=signing-out");
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword =
    authMode === "firebase"
      ? async (email: string) => {
          const { resetPassword } = await import("./firebase");
          await resetPassword(email);
        }
      : undefined;

  const signInWithDemo = async () => {
    await localAuth.signInWithDemo();
  };

  const refreshUserProfile = async () => {
    try {
      if (authMode === "local") {
        await localAuth.fetchUserProfile();
      } else if (authMode === "firebase" && user) {
        // DEVELOPMENT MODE: Only skip backend calls if explicitly disabled
        if (
          process.env.NODE_ENV === "development" &&
          process.env.NEXT_PUBLIC_ENABLE_API_PROXY === "false"
        ) {
          console.log(
            "🔧 [Auth] Development mode: Backend API calls explicitly disabled, refreshing Firebase profile data directly"
          );

          const { getFirebaseAuth } = await import("./firebase");
          const auth = await getFirebaseAuth();
          const currentUser = auth.currentUser;

          if (currentUser) {
            // Use Firebase data directly when explicitly disabled
            setUserProfile({
              name:
                currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "User",
              email: currentUser.email || "",
              phone: currentUser.phoneNumber || "",
              photoURL: currentUser.photoURL || "",
            });
            console.log("✅ [Auth] Profile refreshed from Firebase data");
          }
          return;
        }

        // For Firebase users, fetch the updated profile from the backend
        console.log("🔄 [Auth] Refreshing Firebase user profile...");

        // Get Firebase token for backend authentication
        const { getFirebaseAuth } = await import("./firebase");
        const auth = await getFirebaseAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          console.warn(
            "⚠️ [Auth] No Firebase user found during profile refresh"
          );
          return;
        }

        // Get fresh Firebase token
        const firebaseToken = await currentUser.getIdToken(true); // Force refresh

        // SECURITY: Exchange for backend JWT token via secure API route
        const response = await fetch("/api/auth/firebase-exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ firebaseToken }),
          credentials: "include", // Include httpOnly cookies
        });

        if (!response.ok) {
          console.error(
            "❌ [Auth] Token exchange failed during profile refresh"
          );
          return;
        }

        const data = await response.json();
        if (!data.success || !data.token) {
          console.error("❌ [Auth] Invalid token exchange response");
          return;
        }

        // SECURITY: Fetch updated profile from backend with httpOnly cookies
        const profileResponse = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.token}`,
            "Content-Type": "application/json",
          },
          credentials: "include", // Include httpOnly cookies
        });

        if (!profileResponse.ok) {
          console.error(
            "❌ [Auth] Failed to fetch profile:",
            profileResponse.status
          );
          return;
        }

        const profileData = await profileResponse.json();

        if (profileData.success && profileData.user) {
          console.log(
            "✅ [Auth] Profile refreshed successfully:",
            profileData.user.name
          );

          // Update userProfile state with fresh data from backend
          setUserProfile({
            name:
              profileData.user.name ||
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "User",
            email: profileData.user.email || currentUser.email || "",
            phone: profileData.user.phone || currentUser.phoneNumber || "",
            photoURL: profileData.user.photoURL || currentUser.photoURL || "",
          });

          // SECURITY: No client-side token storage - server manages httpOnly cookies
          setToken(data.token);
        } else {
          console.log(
            "ℹ️ [Auth] No updated profile found in backend, using Firebase data"
          );

          // Fallback to Firebase data if no backend profile exists
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
      }
    } catch (error) {
      console.error("❌ [Auth] Failed to refresh user profile:", error);
      // Don't throw error to avoid breaking the UI
    }
  };

  const value: UnifiedAuthContextType = {
    user,
    userProfile,
    loading,
    authMode,
    config,
    signIn,
    signUp,
    signInWithGoogleProvider,
    signOut,
    resetUserPassword,
    signInWithDemo,
    token,
    refreshUserProfile,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error("useUnifiedAuth must be used within UnifiedAuthProvider");
  }
  return context;
}

// Legacy compatibility - export the same interface as the old auth
export function useAuth() {
  return useUnifiedAuth();
}
