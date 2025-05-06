import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

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