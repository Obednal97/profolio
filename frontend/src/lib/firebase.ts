import { FirebaseApp, initializeApp } from 'firebase/app';
import { 
  Auth, 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export const getFirebase = async () => {
  if (!app) {
    const res = await fetch('/firebase-config.json');
    const config = await res.json();
    app = initializeApp(config);
    auth = getAuth(app);
  }
  return { app, auth };
};

export const getFirebaseAuth = async (): Promise<Auth> => {
  const { auth } = await getFirebase();
  if (!auth) throw new Error('Firebase auth not initialized');
  return auth;
};

// Authentication functions
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  const auth = await getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<UserCredential> => {
  const auth = await getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
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
  provider.addScope('email');
  provider.addScope('profile');
  
  // Optional: Request additional profile information
  // Note: These are optional and users can deny them
  provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
  
  // Set custom parameters to get additional profile info
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  return signInWithPopup(auth, provider);
};

export const signOutUser = async (): Promise<void> => {
  const auth = await getFirebaseAuth();
  return signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
  const auth = await getFirebaseAuth();
  return sendPasswordResetEmail(auth, email);
};

export const onAuthStateChange = async (callback: (user: User | null) => void) => {
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