// import helper functions to work with Firebase Storage
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// import the initialized storage instance from the client app
import { storage } from "@/src/lib/firebase/clientApp";

// import function to update the restaurant document with the image URL
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

// Replace the two functions below
// upload an image for a restaurant and update the restaurant doc
export async function updateRestaurantImage(restaurantId, image) {
  // wrap in try/catch to handle errors
  try {
    // verify a restaurant ID was provided
    if (!restaurantId) {
      throw new Error("No restaurant ID has been provided.");
    }

    // verify an image file with a name was provided
    if (!image || !image.name) {
      throw new Error("A valid image has not been provided.");
    }

    // upload the image and get its public URL
    const publicImageUrl = await uploadImage(restaurantId, image);
    // update the restaurant document with the new image URL
    await updateRestaurantImageReference(restaurantId, publicImageUrl);

    // return the public URL for use in the UI
    return publicImageUrl;
  } catch (error) {
    // log any errors and let the caller handle the failure
    console.error("Error processing request:", error);
  }
}

// helper to upload the file bytes to Firebase Storage and return its URL
async function uploadImage(restaurantId, image) {
  // build a storage path for the image
  const filePath = `images/${restaurantId}/${image.name}`;
  // create a storage reference for the file
  const newImageRef = ref(storage, filePath);
  // upload the file (resumable upload) to the reference
  await uploadBytesResumable(newImageRef, image);

  // return the public download URL for the uploaded file
  return await getDownloadURL(newImageRef);
}