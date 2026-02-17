const express = require("express");
const Stripe = require("stripe");
const User = require("../models/User");

const router = express.Router();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = Stripe(STRIPE_SECRET_KEY || "");

// Subscription prices (Stripe Price IDs) - prefer env overrides
const priceMap = {
  "1m": process.env.STRIPE_PRICE_1M || "price_1m_test", // replace with your test price ID
  "6m": process.env.STRIPE_PRICE_6M || "price_6m_test",
  "12m": process.env.STRIPE_PRICE_12M || "price_12m_test",
};

// Create Stripe Checkout Session
router.post("/create-session", async (req, res) => {
  try {
    const { userId, plan } = req.body;
    if (!STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ error: "Stripe secret key not configured" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!priceMap[plan]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const clientUrl = (
      process.env.CLIENT_URL ||
      req.headers.origin ||
      ""
    ).replace(/\/$/, "");
    if (!clientUrl) {
      return res.status(500).json({ error: "Client URL not configured" });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: priceMap[plan],
          quantity: 1,
        },
      ],
      metadata: {
        userId: String(user._id),
        plan,
      },
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe create-session error:", error?.message || error);
    res
      .status(500)
      .json({ error: error?.message || "Stripe session creation failed" });
  }
});

module.exports = router;
