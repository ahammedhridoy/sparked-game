const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

module.exports = router;
