// Import Firebase auth helpers and providers
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
} from "firebase/auth";

// Import the initialized client auth instance
import { auth } from "@/src/lib/firebase/clientApp";

// Wrapper to subscribe to auth state changes
export function onAuthStateChanged(cb) {
  return _onAuthStateChanged(auth, cb);
}

// Wrapper to subscribe to ID token changes
export function onIdTokenChanged(cb) {
  return _onIdTokenChanged(auth, cb);
}

// Sign in using Google via a popup
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
}

// Sign the current user out
export async function signOut() {
  try {
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
  }
}