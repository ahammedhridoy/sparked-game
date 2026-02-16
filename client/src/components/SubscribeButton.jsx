import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

export default function SubscribeButton({ userId, plan = "1m", className = "", label = "🔥 Upgrade to VIP" }) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!userId) {
      alert("Please login first");
      return;
    }

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn("Stripe publishable key missing (VITE_STRIPE_PUBLISHABLE_KEY)");
    }

    const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001/api`;

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/subscription/create-session`, {
        userId,
        plan,
      });

      const stripe = await loadStripe(publishableKey);
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (error) {
        console.error(error);
        alert(error.message || "Unable to redirect to checkout");
      }
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.error || error.message || "Subscription failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={`btn btn-primary ${className}`} onClick={handleSubscribe} disabled={loading}>
      {loading ? "Redirecting..." : label}
    </button>
  );
}
