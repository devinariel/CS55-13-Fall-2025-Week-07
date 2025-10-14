// mark this component as client-side for Next.js
"use client";

// This component handles the review dialog and uses a Next.js Server Action for form submission

// import React hooks used in the component
import { useEffect, useLayoutEffect, useRef } from "react";
// import a rating picker sub-component
import RatingPicker from "@/src/components/RatingPicker.jsx";
// import the server action that handles form submission
import { handleReviewFormSubmission } from "@/src/app/actions.js";

// ReviewDialog displays a modal dialog with a form to add a review
const ReviewDialog = ({
  isOpen,
  handleClose,
  review,
  onChange,
  userId,
  id,
}) => {
  // ref to the dialog DOM element
  const dialog = useRef();

  // dialogs only render their backdrop when showModal() is called
  useLayoutEffect(() => {
    if (isOpen) {
      dialog.current.showModal();
    } else {
      dialog.current.close();
    }
  }, [isOpen, dialog]);

  // close if clicked outside the dialog content
  const handleClick = (e) => {
    if (e.target === dialog.current) {
      handleClose();
    }
  };

  // render the dialog with a form that uses a Server Action
  return (
    <dialog ref={dialog} onMouseDown={handleClick}>
      <form
        action={handleReviewFormSubmission}
        onSubmit={() => {
          // after submit, close the dialog
          handleClose();
        }}
      >
        <header>
          <h3>Add your review</h3>
        </header>
        <article>
          <RatingPicker />

          <p>
            <input
              type="text"
              name="text"
              id="review"
              placeholder="Write your thoughts here"
              required
              value={review.text}
              onChange={(e) => onChange(e.target.value, "text")}
            />
          </p>

          <input type="hidden" name="restaurantId" value={id} />
          <input type="hidden" name="userId" value={userId} />
        </article>
        <footer>
          <menu>
            <button
              autoFocus
              type="reset"
              onClick={handleClose}
              className="button--cancel"
            >
              Cancel
            </button>
            <button type="submit" value="confirm" className="button--confirm">
              Submit
            </button>
          </menu>
        </footer>
      </form>
    </dialog>
  );
};

// export the component as default
export default ReviewDialog;
