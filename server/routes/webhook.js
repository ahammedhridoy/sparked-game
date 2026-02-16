const express = require("express");
const Stripe = require("stripe");
const User = require("../models/User");
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription events
    if (
      event.type === "checkout.session.completed" ||
      event.type === "invoice.payment_succeeded"
    ) {
      const session = event.data.object;
      const user = await User.findOne({ email: session.customer_email });
      if (user) {
        user.role = "vip";
        user.subscription.status = "active";
        user.subscription.plan =
          session.display_items?.[0]?.plan?.interval || "1m";
        user.subscription.expiresAt = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ); // 30 days for now, can customize per plan
        await user.save();
      }
    }

    res.json({ received: true });
  },
);

module.exports = router;
