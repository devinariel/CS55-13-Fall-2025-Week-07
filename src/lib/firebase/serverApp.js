// Ensure this module runs only on the server in Next.js
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

// Import cookies helper for server-side cookie access
import { cookies } from "next/headers";
// Import functions to initialize Firebase apps
import { initializeServerApp, initializeApp } from "firebase/app";

// Import getAuth to access auth on the server app
import { getAuth } from "firebase/auth";

// Returns an authenticated Firebase Server App and current user for SSR
export async function getAuthenticatedAppForUser() {
  // Read the __session cookie which stores the user's ID token
  const authIdToken = (await cookies()).get("__session")?.value;

  // Initialize a Firebase Server App using the client app as a base
  // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
  const firebaseServerApp = initializeServerApp(
    initializeApp(),
    {
      authIdToken,
    }
  );

  // Get the auth instance from the server app and wait for auth state readiness
  const auth = getAuth(firebaseServerApp);
  await auth.authStateReady();

  // Return both the server app and the current authenticated user
  return { firebaseServerApp, currentUser: auth.currentUser };
}
