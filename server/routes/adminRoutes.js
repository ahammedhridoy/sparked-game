const express = require("express");
const User = require("../models/User");
const Game = require("../models/Game");

const router = express.Router();

// Stats for admin home
router.get("/stats", async (req, res) => {
  try {
    const [totalGames, activeGames, totalPlayers] = await Promise.all([
      Game.countDocuments({}),
      Game.countDocuments({ status: { $in: ["waiting", "playing"] } }),
      User.countDocuments({}),
    ]);

    res.json({ totalGames, activeGames, totalPlayers });
  } catch (e) {
    console.error("Admin stats error:", e);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// List users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const rows = users.map((u) => ({
      id: String(u._id),
      email: u.email,
      role: u.role,
      subscription: u.subscription || {},
      freePlayEndsAt: u.freePlayEndsAt,
      createdAt: u.createdAt,
    }));
    res.json({ users: rows });
  } catch (e) {
    console.error("Admin users error:", e);
    res.status(500).json({ error: "Failed to load users" });
  }
});

// Update user (role/plan/status/expiresAt)
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role, plan, status, expiresAt } = req.body || {};

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (role) user.role = role;
    user.subscription = user.subscription || {};
    if (plan !== undefined) user.subscription.plan = plan;
    if (status) user.subscription.status = status;

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === "null") {
        user.subscription.expiresAt = null;
      } else if (expiresAt) {
        user.subscription.expiresAt = new Date(expiresAt);
      }
    } else if (plan) {
      const months =
        plan === "12m" ? 12 : plan === "6m" ? 6 : plan === "1m" ? 1 : 0;
      if (months > 0) {
        const now = new Date();
        const current = user.subscription?.expiresAt
          ? new Date(user.subscription.expiresAt)
          : null;
        const base =
          current && current.getTime() > now.getTime() ? current : now;
        const newExp = new Date(base);
        newExp.setMonth(newExp.getMonth() + months);
        user.subscription.expiresAt = newExp;
      }
    }

    if (role === "vip") {
      user.subscription.status = user.subscription.status || "active";
      user.freePlayEndsAt = null;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        freePlayEndsAt: user.freePlayEndsAt,
      },
    });
  } catch (e) {
    console.error("Admin update user error:", e);
    res.status(500).json({ error: "Failed to update user" });
  }
});

module.exports = router;
