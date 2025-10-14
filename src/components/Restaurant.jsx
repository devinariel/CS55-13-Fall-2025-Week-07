// mark this file as a client component for Next.js
"use client";

// This component shows one individual restaurant
// It receives data from src/app/restaurant/[id]/page.jsx

// import React hooks and Suspense for lazy loading
import { React, useState, useEffect, Suspense } from "react";
// import dynamic to lazily load the review dialog
import dynamic from "next/dynamic";
// import helper to subscribe to restaurant snapshots
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
// import hook to get current user info
import { useUser } from "@/src/lib/getUser";
// import the restaurant details child component
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx";
// import function to upload a restaurant image
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

// lazily import the ReviewDialog component
const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx"));

// main exported component for a restaurant view
export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
  children,
}) {
  // state for restaurant details and dialog open state
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  const [isOpen, setIsOpen] = useState(false);

  // determine the user ID from auth hook or from initial props
  const userId = useUser()?.uid || initialUserId;
  // state for the review being composed
  const [review, setReview] = useState({
    rating: 0,
    text: "",
  });

  // helper to update the review state when form fields change
  const onChange = (value, name) => {
    setReview({ ...review, [name]: value });
  };

  // handle when a new restaurant image file is selected
  async function handleRestaurantImage(target) {
    // get the first file from the input target
    const image = target.files ? target.files[0] : null;
    if (!image) {
      return;
    }

    // upload the image and get back a public URL
    const imageURL = await updateRestaurantImage(id, image);
    // update local state so the UI shows the new photo
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL });
  }

  // close the review dialog and reset the review state
  const handleClose = () => {
    setIsOpen(false);
    setReview({ rating: 0, text: "" });
  };

  // subscribe to restaurant snapshot updates when id changes
  useEffect(() => {
    return getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data);
    });
  }, [id]);

  // render the restaurant details and, if signed in, the review dialog
  return (
    <>
      <RestaurantDetails
        restaurant={restaurantDetails}
        userId={userId}
        handleRestaurantImage={handleRestaurantImage}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      >
        {children}
      </RestaurantDetails>
      {userId && (
        <Suspense fallback={<p>Loading...</p>}>
          <ReviewDialog
            isOpen={isOpen}
            handleClose={handleClose}
            review={review}
            onChange={onChange}
            userId={userId}
            id={id}
          />
        </Suspense>
      )}
    </>
  );
}
