const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  role: { type: String, enum: ["free", "vip", "admin"], default: "free" },
  subscription: {
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
    plan: { type: String, enum: ["1m", "6m", "12m"], default: null },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
