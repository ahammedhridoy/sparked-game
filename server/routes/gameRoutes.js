const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Game = require("../models/Game");
const { createDeck, dealInitialCards } = require("../config/cards");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads directory:", uploadsDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    const prefix = file.mimetype.startsWith("video/") ? "vid" : "aud";
    const filename = `${prefix}_${Date.now()}_${uuidv4()}${ext}`;
    console.log("📁 Saving file as:", filename);
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    console.log("📤 Uploading file:", file.originalname, file.mimetype);
    if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only video and audio files are allowed"));
    }
  },
});

// ===== UPLOAD MEDIA =====
router.post("/upload/media", upload.single("media"), (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No file in request");
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const type = req.file.mimetype.startsWith("video/") ? "video" : "audio";
    const url = `/uploads/${req.file.filename}`;

    console.log("✅ File uploaded:", url, "Type:", type);

    res.json({ success: true, url, type });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

// ===== CREATE GAME =====
router.post("/create", async (req, res) => {
  console.log("📝 Create game request:", req.body);

  try {
    const { playerName } = req.body;

    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: "Player name required" });
    }

    let gameId;
    let attempts = 0;
    do {
      gameId = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await Game.findOne({ gameId });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const deck = createDeck();
    const { p1Hand, p2Hand, startCard, remainingDeck } = dealInitialCards(deck);

    const game = new Game({
      gameId,
      player1: {
        name: playerName.trim(),
        odId: "player1",
        hand: p1Hand,
        count: 7,
      },
      p2Temp: p2Hand,
      deck: remainingDeck,
      discard: [startCard],
      turn: "player1",
      spark: startCard.color,
      status: "waiting",
      chat: [],
    });

    await game.save();
    console.log("✅ Game created:", gameId);

    res.json({
      success: true,
      gameId,
      playerId: "player1",
      game: game.toObject(),
    });
  } catch (error) {
    console.error("❌ Create game error:", error);
    res.status(500).json({ error: "Failed to create game" });
  }
});

// ===== JOIN GAME =====
router.post("/join", async (req, res) => {
  console.log("📝 Join game request:", req.body);

  try {
    const { gameId, playerName } = req.body;

    if (!gameId || !playerName) {
      return res
        .status(400)
        .json({ error: "Game ID and player name required" });
    }

    const game = await Game.findOne({ gameId: gameId.toString() });

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.player2 && game.player2.name) {
      return res.status(400).json({ error: "Game is full" });
    }

    game.player2 = {
      name: playerName.trim(),
      odId: "player2",
      hand: game.p2Temp,
      count: game.p2Temp.length,
    };
    game.p2Temp = undefined;
    game.status = "playing";

    await game.save();
    console.log("✅ Player joined:", gameId);

    const io = req.app.get("io");
    if (io) {
      io.to(gameId).emit("gameState", { game: game.toObject() });
      io.to(gameId).emit("playerJoined", { playerId: "player2" });
    }

    res.json({
      success: true,
      gameId,
      playerId: "player2",
      game: game.toObject(),
    });
  } catch (error) {
    console.error("❌ Join game error:", error);
    res.status(500).json({ error: "Failed to join game" });
  }
});

// ===== GET GAME =====
router.get("/:gameId", async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId });
    res.json({ game: game ? game.toObject() : null });
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({ error: "Failed to get game" });
  }
});

// ===== DELETE GAME =====
router.delete("/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;

    const io = req.app.get("io");
    if (io) {
      io.to(gameId).emit("gameDeleted", { gameId });
    }

    await Game.findOneAndDelete({ gameId });
    console.log("🗑️ Game deleted:", gameId);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ error: "Failed to delete" });
  }
});

// ===== PLAY CARD =====
router.post("/:gameId/play", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, cardUid } = req.body;

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const playerKey = playerId === "player1" ? "player1" : "player2";
    const oppKey = playerId === "player1" ? "player2" : "player1";

    const cardIndex = game[playerKey].hand.findIndex((c) => c.uid === cardUid);
    if (cardIndex === -1) {
      return res.status(400).json({ error: "Card not found" });
    }

    const card = game[playerKey].hand[cardIndex];
    const topCard = game.discard[game.discard.length - 1];

    if (
      card.color !== "wild" &&
      card.color !== game.spark &&
      card.value !== topCard.value
    ) {
      return res.status(400).json({ error: "Invalid play" });
    }

    game[playerKey].hand.splice(cardIndex, 1);
    game[playerKey].count = game[playerKey].hand.length;
    game.discard.push(card);

    if (game[playerKey].hand.length === 0) {
      game.winner = playerId;
      game.status = "finished";
      await game.save();

      const io = req.app.get("io");
      if (io) io.to(gameId).emit("gameState", { game: game.toObject() });

      return res.json({ success: true, game: game.toObject() });
    }

    if (card.type === "wild") {
      if (card.effect === "swap1" || card.effect === "swap2") {
        const count = card.effect === "swap1" ? 1 : 2;
        for (let i = 0; i < count; i++) {
          if (game[playerKey].hand.length > 0 && game[oppKey].hand.length > 0) {
            const myIdx = Math.floor(
              Math.random() * game[playerKey].hand.length,
            );
            const oppIdx = Math.floor(Math.random() * game[oppKey].hand.length);
            const temp = game[playerKey].hand[myIdx];
            game[playerKey].hand[myIdx] = game[oppKey].hand[oppIdx];
            game[oppKey].hand[oppIdx] = temp;
          }
        }
        game[playerKey].count = game[playerKey].hand.length;
        game[oppKey].count = game[oppKey].hand.length;
        game.turn = oppKey;
        game.needsColorPick = false;
      } else if (card.effect === "draw4") {
        for (let i = 0; i < 4 && game.deck.length > 0; i++) {
          game[oppKey].hand.push(game.deck.pop());
        }
        game[oppKey].count = game[oppKey].hand.length;
        game.needsColorPick = true;
        game.turn = playerId;
      } else if (card.effect === "skip") {
        game.needsColorPick = true;
        game.turn = playerId;
      } else {
        game.needsColorPick = true;
        game.turn = playerId;
      }
      game.verify = undefined;
    } else if (card.type === "task") {
      game.verify = {
        target: oppKey,
        from: playerId,
        card: card,
        proofUrl: null,
        proofType: null,
        status: "waiting_proof",
      };
      game.spark = card.color;
    } else {
      game.spark = card.color;
      game.turn = oppKey;
    }

    await game.save();

    const io = req.app.get("io");
    if (io) io.to(gameId).emit("gameState", { game: game.toObject() });

    res.json({ success: true, game: game.toObject() });
  } catch (error) {
    console.error("Play card error:", error);
    res.status(500).json({ error: "Failed to play card" });
  }
});

// ===== PICK COLOR =====
router.post("/:gameId/color", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, color } = req.body;

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const topCard = game.discard[game.discard.length - 1];

    game.spark = color;
    game.needsColorPick = false;

    if (topCard?.effect === "skip") {
      game.turn = playerId;
    } else {
      game.turn = playerId === "player1" ? "player2" : "player1";
    }

    await game.save();

    const io = req.app.get("io");
    if (io) io.to(gameId).emit("gameState", { game: game.toObject() });

    res.json({ success: true, game: game.toObject() });
  } catch (error) {
    console.error("Pick color error:", error);
    res.status(500).json({ error: "Failed to pick color" });
  }
});

// ===== SUBMIT PROOF =====
router.post("/:gameId/submit-proof", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, proofUrl, proofType } = req.body;

    console.log("📹 Submit proof:", { gameId, playerId, proofUrl, proofType });

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!game.verify || game.verify.from !== playerId) {
      return res.status(400).json({ error: "No verification pending" });
    }

    // Ensure URL starts with /
    let cleanUrl = proofUrl;
    if (proofUrl && !proofUrl.startsWith("/")) {
      const base = import.meta.env.VITE_BACKEND_URL;
      cleanUrl = `${base}${proofUrl.startsWith("/") ? "" : "/"}${proofUrl}`;
    }

    game.verify.proofUrl = cleanUrl;
    game.verify.proofType = proofType;
    game.verify.status = "pending";

    await game.save();
    console.log("✅ Proof saved:", cleanUrl);

    const io = req.app.get("io");
    if (io) {
      io.to(gameId).emit("gameState", { game: game.toObject() });
    }

    res.json({ success: true, game: game.toObject() });
  } catch (error) {
    console.error("Submit proof error:", error);
    res.status(500).json({ error: "Failed to submit proof" });
  }
});

// ===== SKIP PROOF =====
router.post("/:gameId/skip-proof", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const oppKey = game.verify?.target;
    const playerKey = playerId === "player1" ? "player1" : "player2";

    for (let i = 0; i < 2 && game.deck.length > 0; i++) {
      game[playerKey].hand.push(game.deck.pop());
    }
    game[playerKey].count = game[playerKey].hand.length;

    game.turn = oppKey;
    game.verify = undefined;

    await game.save();

    const io = req.app.get("io");
    if (io) io.to(gameId).emit("gameState", { game: game.toObject() });

    res.json({ success: true, game: game.toObject() });
  } catch (error) {
    console.error("Skip proof error:", error);
    res.status(500).json({ error: "Failed to skip" });
  }
});

// ===== VERIFY =====
router.post("/:gameId/verify", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, success } = req.body;

    console.log("✅ Verify request:", { gameId, playerId, success });

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!game.verify || game.verify.target !== playerId) {
      return res.status(400).json({ error: "Cannot verify" });
    }

    const cardPlayer = game.verify.from;

    if (success) {
      game.turn = playerId;
    } else {
      const cardPlayerKey = cardPlayer === "player1" ? "player1" : "player2";
      for (let i = 0; i < 2 && game.deck.length > 0; i++) {
        game[cardPlayerKey].hand.push(game.deck.pop());
      }
      game[cardPlayerKey].count = game[cardPlayerKey].hand.length;
      game.turn = playerId;
    }

    game.verify = undefined;
    await game.save();

    console.log("✅ Verification complete, turn:", game.turn);

    const io = req.app.get("io");
    if (io) io.to(gameId).emit("gameState", { game: game.toObject() });

    res.json({ success: true, game: game.toObject() });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Failed to verify" });
  }
});

// ===== DRAW CARD =====
router.post("/:gameId/draw", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.deck.length === 0 && game.discard.length > 1) {
      const top = game.discard.pop();
      game.deck = game.discard.map((c) => ({
        ...c,
        uid: Math.random().toString(36).substr(2, 9),
      }));
      game.discard = [top];
      for (let i = game.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
      }
    }

    if (game.deck.length === 0) {
      return res.status(400).json({ error: "No cards" });
    }

    const card = game.deck.pop();
    await game.save();

    res.json({ success: true, card, game: game.toObject() });
  } catch (error) {
    console.error("Draw error:", error);
    res.status(500).json({ error: "Failed to draw" });
  }
});

// ===== ADD TO HAND =====
router.post("/:gameId/add-to-hand", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, card } = req.body;

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const playerKey = playerId === "player1" ? "player1" : "player2";
    game[playerKey].hand.push(card);
    game[playerKey].count = game[playerKey].hand.length;
    game.turn = playerId === "player1" ? "player2" : "player1";

    await game.save();

    const io = req.app.get("io");
    if (io) io.to(gameId).emit("gameState", { game: game.toObject() });

    res.json({ success: true, game: game.toObject() });
  } catch (error) {
    console.error("Add to hand error:", error);
    res.status(500).json({ error: "Failed" });
  }
});

// ===== CHAT =====
router.post("/:gameId/chat", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, text, type, url } = req.body;

    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    let cleanUrl = url;
    if (url && !url.startsWith("/")) {
      cleanUrl = "/" + url;
    }

    const message = {
      sender: playerId,
      text: text || "",
      type: type || "text",
      url: cleanUrl,
      timestamp: new Date(),
    };

    if (!game.chat) game.chat = [];
    game.chat.push(message);
    if (game.chat.length > 100) game.chat = game.chat.slice(-100);

    await game.save();

    const io = req.app.get("io");
    if (io) io.to(gameId).emit("newMessage", { message });

    res.json({ success: true, message });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
