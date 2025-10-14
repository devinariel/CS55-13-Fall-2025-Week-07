// Import generator for fake restaurants and reviews used in dev/testing
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

// Import Firestore functions we use across this module
import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
  getFirestore,
} from "firebase/firestore";

// Import the already-initialized client-side Firestore instance
import { db } from "@/src/lib/firebase/clientApp";

// Update the photo reference on a restaurant document
export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl
) {
  // build a doc reference for the restaurant
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
  if (restaurantRef) {
    // update the photo field on the restaurant document
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

// helper used inside transactions to update rating counts and set the rating doc
const updateWithRating = async (
  transaction,
  docRef,
  newRatingDocument,
  review
) => {
  // read the restaurant document inside the transaction
  const restaurant = await transaction.get(docRef);
  const data = restaurant.data();
  // compute new counts and sums for ratings
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;
  const newSumRating = (data?.sumRating || 0) + Number(review.rating);
  const newAverage = newSumRating / newNumRatings;

  // update the restaurant summary fields in the transaction
  transaction.update(docRef, {
    numRatings: newNumRatings,
    sumRating: newSumRating,
    avgRating: newAverage,
  });

  // create the new rating document with a timestamp
  transaction.set(newRatingDocument, {
    ...review,
    timestamp: Timestamp.fromDate(new Date()),
  });
};

// Add a review to a restaurant using a transaction to keep counts consistent
export async function addReviewToRestaurant(db, restaurantId, review) {
  // validate inputs
  if (!restaurantId) {
    throw new Error("No restaurant ID has been provided.");
  }

  if (!review) {
    throw new Error("A valid review has not been provided.");
  }

  try {
    // reference the restaurant document
    const docRef = doc(collection(db, "restaurants"), restaurantId);
    // create a new document reference for the rating subcollection
    const newRatingDocument = doc(
      collection(db, `restaurants/${restaurantId}/ratings`)
    );

    // run a transaction that updates restaurant counts and sets the rating
    await runTransaction(db, (transaction) =>
      updateWithRating(transaction, docRef, newRatingDocument, review)
    );
  } catch (error) {
    // log and rethrow any errors
    console.error(
      "There was an error adding the rating to the restaurant",
      error
    );
    throw error;
  }
}

// Apply filters to a Firestore query based on the passed filters object
function applyQueryFilters(q, { category, city, price, sort }) {
  // filter by category if provided
  if (category) {
    q = query(q, where("category", "==", category));
  }
  // filter by city if provided
  if (city) {
    q = query(q, where("city", "==", city));
  }
  // filter by price level if provided (uses length of price string)
  if (price) {
    q = query(q, where("price", "==", price.length));
  }
  // apply sort order: default by avgRating desc
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") {
    // or sort by number of ratings
    q = query(q, orderBy("numRatings", "desc"));
  }
  return q;
}

// Get restaurants once using optional filters (server use)
export async function getRestaurants(db = db, filters = {}) {
  // start with a basic restaurants query
  let q = query(collection(db, "restaurants"));

  // apply filters and ordering
  q = applyQueryFilters(q, filters);
  // execute the query
  const results = await getDocs(q);
  // map Firestore docs to plain objects with timestamps converted
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// Subscribe to restaurant query updates and invoke callback with results
export function getRestaurantsSnapshot(cb, filters = {}) {
  // ensure caller provided a function
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  // build the query and apply filters
  let q = query(collection(db, "restaurants"));
  q = applyQueryFilters(q, filters);

  // return the onSnapshot unsubscribe function
  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    cb(results);
  });
}

// Get a single restaurant document by id
export async function getRestaurantById(db, restaurantId) {
  // validate input
  if (!restaurantId) {
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }
  // fetch the document and convert timestamp
  const docRef = doc(db, "restaurants", restaurantId);
  const docSnap = await getDoc(docRef);
  return {
    ...docSnap.data(),
    timestamp: docSnap.data().timestamp.toDate(),
  };
}

// Placeholder to subscribe to a restaurant document snapshot by id (not implemented)
export function getRestaurantSnapshotById(restaurantId, cb) {
  return;
}

// Get reviews for a restaurant ordered by timestamp desc
export async function getReviewsByRestaurantId(db, restaurantId) {
  // validate input
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // build query for ratings subcollection ordered by timestamp desc
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );

  // execute the query and convert timestamps
  const results = await getDocs(q);
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// Subscribe to review snapshots for a restaurant and call cb with results
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  // validate input
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // build query for ratings ordered by timestamp desc
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );
  // subscribe and map results to plain objects
  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });
    cb(results);
  });
}

// Add a set of fake restaurants and ratings to Firestore for testing
export async function addFakeRestaurantsAndReviews() {
  // generate test data
  const data = await generateFakeRestaurantsAndReviews();
  for (const { restaurantData, ratingsData } of data) {
    try {
      // add the restaurant document
      const docRef = await addDoc(
        collection(db, "restaurants"),
        restaurantData
      );

      // add each rating to the restaurant's ratings subcollection
      for (const ratingData of ratingsData) {
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"),
          ratingData
        );
      }
    } catch (e) {
      console.log("There was an error adding the document");
      console.error("Error adding document: ", e);
    }
  }
}
