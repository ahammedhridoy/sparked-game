import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const stripePromise = loadStripe(
  "pk_test_51Pqw5D2NKSixjN19HNOHyh0o3axOw8XNBEXQIcYJt4pBmDw7e5dEmYfvnqrubXh35UoF5jlKwbrra4EHvWK18Ucz004xTLZCNi",
); // your test publishable key

export default function SubscribeButton({ userId, plan }) {
  const handleSubscribe = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:5001/api/subscription/create-session",
        { userId, plan },
      );
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={handleSubscribe}>Subscribe</button>;
}
