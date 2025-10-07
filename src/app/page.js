// Import the RestaurantListings React component to render the list
import RestaurantListings from "@/src/components/RestaurantListings.jsx";
// Import helper to fetch restaurants from Firestore
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
// Import helper to get an authenticated Firebase app on the server
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
// Import getFirestore to obtain a Firestore instance from the app
import { getFirestore } from "firebase/firestore";

// Force next.js to treat this route as server-side rendered
// Without this line, during the build process, next.js will treat this route as static and build a static HTML file for it

// Force Next.js to render this route on every request (no static HTML)
export const dynamic = "force-dynamic";

// This line also forces this route to be server-side rendered
// export const revalidate = 0;

// The default export is an async server component for the home page
export default async function Home(props) {
  // Get search params passed to the page (e.g., ?city=London)
  const searchParams = await props.searchParams;
  // Using searchParams allows server-side filtering like ?city=London
  // Retrieve an authenticated Firebase server app for the current user
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Fetch restaurants from Firestore using the server app and params
  const restaurants = await getRestaurants(
    getFirestore(firebaseServerApp),
    searchParams
  );
  // Return the JSX for the page; note: JSX lines are left unchanged
  return (
    <main className="main__home">
      <RestaurantListings
        initialRestaurants={restaurants}
        searchParams={searchParams}
      />
    </main>
  );
}
