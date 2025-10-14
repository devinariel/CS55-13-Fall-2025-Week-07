// import the Gemini model and Google AI plugin from genkit
import { gemini20Flash, googleAI } from "@genkit-ai/googleai";
// import the genkit helper to create an AI client
import { genkit } from "genkit";
// import helper to fetch reviews from Firestore
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
// import server helper to get an authenticated Firebase app
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
// import getFirestore to create a Firestore instance from the app
import { getFirestore } from "firebase/firestore";

// server component: generate a one-sentence summary using Gemini
export async function GeminiSummary({ restaurantId }) {
  // get an authenticated Firebase server app for the current user
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // fetch reviews for the restaurant from Firestore
  const reviews = await getReviewsByRestaurantId(
    // create a Firestore instance from the server app
    getFirestore(firebaseServerApp),
    // pass the restaurant ID to fetch its reviews
    restaurantId
  );

  // use this character to separate reviews in the prompt
  const reviewSeparator = "@";
  // build a prompt that lists all review texts separated by reviewSeparator
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;

  try {
    // ensure the Gemini API key is available in environment
    if (!process.env.GEMINI_API_KEY) {
      // Make sure GEMINI_API_KEY environment variable is set:
      // https://firebase.google.com/docs/genkit/get-started
      throw new Error(
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"'
      );
    }

    // create a genkit AI client with the Google AI plugin and default model
    const ai = genkit({
      plugins: [googleAI()],
      model: gemini20Flash, // set default model
    });
    // generate text from the prompt
    const { text } = await ai.generate(prompt);

    // return JSX that shows the summary text and a note about Gemini
    return (
      <div className="restaurant__review_summary">
        <p>{text}</p>
        <p>✨ Summarized with Gemini</p>
      </div>
    );
  } catch (e) {
    // log errors and render an error message
    console.error(e);
    return <p>Error summarizing reviews.</p>;
  }
}

// simple skeleton shown while the summary is being generated
export function GeminiSummarySkeleton() {
  // render placeholder copy while waiting for Gemini
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
