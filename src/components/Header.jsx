// Mark this component as a client component for Next.js
"use client";
// Import React and the useEffect hook
import React, { useEffect } from "react";
// Import Next.js Link component for client-side navigation
import Link from "next/link";
// Import auth helpers: sign-in, sign-out and token listener
import {
  signInWithGoogle,
  signOut,
  onIdTokenChanged,
} from "@/src/lib/firebase/auth.js";
// Import helper to add fake data into Firestore
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
// Import cookie helpers to set and delete cookies on the client
import { setCookie, deleteCookie } from "cookies-next";

// Custom hook to manage user session and cookie syncing
function useUserSession(initialUser) {
  // Set up an effect that listens for token changes
  useEffect(() => {
    // Subscribe to ID token changes and update the __session cookie
    return onIdTokenChanged(async (user) => {
      // If we have a user, get an ID token and store it in a cookie
      if (user) {
        const idToken = await user.getIdToken();
        await setCookie("__session", idToken);
      } else {
        // If no user, remove the __session cookie
        await deleteCookie("__session");
      }
      // If the initial user is the same as the new user, do nothing
      if (initialUser?.uid === user?.uid) {
        return;
      }
      // Otherwise reload the page to reflect auth state changes
      window.location.reload();
    });
  }, [initialUser]);

  // Return the initial user to the caller
  return initialUser;
}

// Header component that shows sign-in / profile controls
export default function Header({ initialUser }) {
  // Use the user session hook to get the current user
  const user = useUserSession(initialUser);

  // Handler for sign-out link clicks
  const handleSignOut = (event) => {
    event.preventDefault();
    signOut();
  };

  // Handler for sign-in link clicks
  const handleSignIn = (event) => {
    event.preventDefault();
    signInWithGoogle();
  };

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Friendly Eats
      </Link>
      {user ? (
        <>
          <div className="profile">
            <p>
              <img
                className="profileImage"
                src={user.photoURL || "/profile.svg"}
                alt={user.email}
              />
              {user.displayName}
            </p>

            <div className="menu">
              ...
              <ul>
                <li>{user.displayName}</li>

                <li>
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                <li>
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="profile">
          <a href="#" onClick={handleSignIn}>
            <img src="/profile.svg" alt="A placeholder user image" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
