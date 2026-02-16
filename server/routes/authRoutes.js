const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Utility: ensure user subscription not expired
async function ensureNotExpired(user) {
  try {
    if (
      user?.subscription?.expiresAt &&
      new Date(user.subscription.expiresAt).getTime() < Date.now()
    ) {
      user.role = "free";
      user.subscription.status = "inactive";
      await user.save();
    }
  } catch (e) {
    // ignore
  }
  return user;
}

// POST /api/auth/google
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, googleId });
    }

    // Check expiry and downgrade if needed
    user = await ensureNotExpired(user);

    // Send back user info
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid Google token" });
  }
});

// GET /api/auth/me?id=... or /api/auth/me?email=...
router.get("/me", async (req, res) => {
  try {
    const { id, email } = req.query;
    if (!id && !email) {
      return res.status(400).json({ error: "Provide id or email" });
    }
    let user;
    if (id) user = await User.findById(id);
    else user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    user = await ensureNotExpired(user);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get user" });
  }
});

module.exports = router;
