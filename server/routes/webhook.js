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

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const email = session.customer_email;
          const plan = session.metadata?.plan || "1m";

          const user = await User.findOne({ email });
          if (user) {
            user.role = "vip";
            user.subscription = user.subscription || {};
            user.subscription.status = "active";
            user.subscription.plan = plan;
            user.subscription.stripeCustomerId = session.customer || null;
            user.subscription.stripeSubscriptionId =
              (typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id) || null;
            // Set expiry based on plan
            const months = plan === "12m" ? 12 : plan === "6m" ? 6 : 1;
            const expires = new Date();
            expires.setMonth(expires.getMonth() + months);
            user.subscription.expiresAt = expires;
            await user.save();
          }
          break;
        }
        case "customer.subscription.deleted":
        case "invoice.payment_failed": {
          const subscription = event.data.object;
          let email;
          // Try to get customer email for deletion events (may require lookup)
          if (subscription?.customer_email) {
            email = subscription.customer_email;
          }
          if (email) {
            const user = await User.findOne({ email });
            if (user) {
              user.role = "free";
              user.subscription.status = "canceled";
              await user.save();
            }
          }
          break;
        }
        default:
          // ignore other events
          break;
      }

      res.json({ received: true });
    } catch (e) {
      console.error("Webhook handling error:", e);
      res.status(500).send("Webhook handler failed");
    }
  },
);

module.exports = router;
