import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { getFirebaseConfig } from "./authConfig";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Type definition for iOS Safari standalone property
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * Detect if the app is running in PWA standalone mode
 */
const isPWAStandalone = (): boolean => {
  if (typeof window === "undefined") return false;

  return (
    // PWA display mode detection
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari standalone detection
    (navigator as NavigatorWithStandalone).standalone === true ||
    // Android app context detection
    document.referrer.includes("android-app://") ||
    // Additional PWA context checks
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
};

export const getFirebase = async () => {
  // Ensure we're in a browser environment
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized in the browser");
  }

  if (!app) {
    try {
      // Use the new environment-based config system
      const config = await getFirebaseConfig();

      if (!config) {
        throw new Error(
          "No Firebase configuration available. Please set environment variables or provide firebase-config.json"
        );
      }

      console.log(
        "🔥 Initializing Firebase with config source:",
        config.apiKey?.substring(0, 10) + "..."
      );
      app = initializeApp(config);
      auth = getAuth(app);
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      throw error;
    }
  }
  return { app, auth };
};

export const getFirebaseAuth = async (): Promise<Auth> => {
  // Ensure we're in a browser environment
  if (typeof window === "undefined") {
    throw new Error("Firebase auth can only be accessed in the browser");
  }

  const { auth } = await getFirebase();
  if (!auth) throw new Error("Firebase auth not initialized");
  return auth;
};

// Authentication functions
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const auth = await getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> => {
  const auth = await getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }

  return userCredential;
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();

  // Request basic profile information (required)
  provider.addScope("email");
  provider.addScope("profile");

  // Optional: Request additional profile information
  // Note: These are optional and users can deny them
  provider.addScope("https://www.googleapis.com/auth/user.phonenumbers.read");

  // Set custom parameters to get additional profile info
  provider.setCustomParameters({
    prompt: "select_account",
  });

  // 🔧 PWA FIX: Use redirect-based auth in PWA standalone mode
  // Popup auth often fails in PWA due to security restrictions
  if (isPWAStandalone()) {
    console.log("🔄 PWA mode detected: Using redirect-based Google auth");
    // For redirect flow, we need to handle this differently
    // The calling code should handle the redirect result
    await signInWithRedirect(auth, provider);
    // This function won't return normally in redirect flow
    // The page will redirect and return with auth result
    throw new Error("REDIRECT_INITIATED"); // Special error to indicate redirect started
  }

  const result = await signInWithPopup(auth, provider);
  
  // Wait for auth state to be fully updated
  await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === result.user.uid) {
        unsubscribe();
        resolve(user);
      }
    });
    // Timeout after 5 seconds
    setTimeout(() => {
      unsubscribe();
      resolve(result.user);
    }, 5000);
  });
  
  return result;
};

/**
 * Handle Google auth redirect result (for PWA mode)
 * Call this function when the app loads to check for pending redirect results
 */
export const handleGoogleRedirectResult =
  async (): Promise<UserCredential | null> => {
    const auth = await getFirebaseAuth();

    try {
      const result = await getRedirectResult(auth);
      if (result) {
        console.log("✅ Google auth redirect successful:", result);
      }
      return result;
    } catch (error) {
      console.error("❌ Google auth redirect failed:", error);
      throw error;
    }
  };

export const signOutUser = async (): Promise<void> => {
  const auth = await getFirebaseAuth();
  return signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
  const auth = await getFirebaseAuth();
  return sendPasswordResetEmail(auth, email);
};

export const onAuthStateChange = async (
  callback: (user: User | null) => void
) => {
  const auth = await getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
};

// Helper function to get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const auth = await getFirebaseAuth();
  return auth.currentUser;
};

// Helper function to get user token
export const getUserToken = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
};
