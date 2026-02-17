import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import api from "../services/api";

export default function SubscribeButton({
  userId,
  plan = "1m",
  className = "",
  label = "🔥 Upgrade to VIP",
}) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!userId) {
      alert("Please login first");
      return;
    }

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn(
        "Stripe publishable key missing (VITE_STRIPE_PUBLISHABLE_KEY)"
      );
    }

    try {
      setLoading(true);
      const { data } = await api.post(`/subscription/create-session`, {
        userId,
        plan,
      });

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      const stripe = await loadStripe(publishableKey);
      if (stripe?.redirectToCheckout) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (error) {
          console.error(error);
          alert(error.message || "Unable to redirect to checkout");
        }
      } else {
        throw new Error(
          "redirectToCheckout not supported; missing session URL"
        );
      }
    } catch (error) {
      const message =
        error?.response?.data?.error || error.message || "Subscription failed";
      console.error("Stripe create-session failed:", message);
      alert(`Stripe session creation failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`btn btn-primary ${className}`}
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading ? "Redirecting..." : label}
    </button>
  );
}
