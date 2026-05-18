import { firebaseAuth } from "../firebase";

function ensureFirebaseAuth() {
  if (!firebaseAuth) {
    throw new Error("Firebase Auth is not configured. Add REACT_APP_FIREBASE_* variables.");
  }
  return firebaseAuth;
}

export async function signInWithFirebase(email, password) {
  const auth = ensureFirebaseAuth();
  const credentials = await auth.signInWithEmailAndPassword(email, password);
  return credentials.user.getIdToken();
}

export async function sendFirebaseResetEmail(email) {
  const auth = ensureFirebaseAuth();
  return auth.sendPasswordResetEmail(email);
}

export async function confirmFirebasePasswordReset(oobCode, newPassword) {
  const auth = ensureFirebaseAuth();
  return auth.confirmPasswordReset(oobCode, newPassword);
}
