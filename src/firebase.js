import firebase from "firebase/compat/app";
import "firebase/compat/analytics";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

export const firebaseApp = hasFirebaseConfig
  ? (firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig))
  : null;
export const firebaseAuth = firebaseApp ? firebase.auth() : null;

export async function initFirebaseAnalytics() {
  const measurementId = firebaseConfig.measurementId;
  if (!measurementId || !firebaseApp) return null;

  try {
    return firebase.analytics();
  } catch {
    return null;
  }
}
