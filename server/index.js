require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db");
const gameRoutes = require("./routes/gameRoutes");
const socketHandler = require("./socket/socketHandler");
const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const webhookRoutes = require("./routes/webhook");
const adminRoutes = require("./routes/adminRoutes");
const User = require("./models/User");

// ✅ CREATE APP FIRST
const app = express();
const server = http.createServer(app);

// ---------------- CORS ----------------
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

// ---------------- WEBHOOK (RAW BODY BEFORE JSON PARSER) ----------------
// Important: mount webhook BEFORE express.json so Stripe can verify signature
app.use("/webhook", webhookRoutes);

// Body parsers
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// ---------------- SOCKET ----------------
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

// ---------------- DB ----------------
connectDB();

// ---------------- LOGGING ----------------
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ---------------- ROUTES ----------------
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/admin", adminRoutes);

// ---------------- MIME TYPES ----------------
const mimeTypes = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".m4v": "video/mp4",
  ".3gp": "video/3gpp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
};

// ---------------- UPLOAD STREAM ----------------
app.get("/uploads/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, "uploads", filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const stat = fs.statSync(filepath);
    const fileSize = stat.size;
    const ext = path.extname(filename).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.setHeader("Access-Control-Allow-Origin", "*");

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const stream = fs.createReadStream(filepath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": contentType,
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });

      fs.createReadStream(filepath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- HEALTH ----------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ---------------- SOCKET HANDLER ----------------
socketHandler(io);

// ---------------- ROOT ----------------
app.get("/", (req, res) => {
  res.send("🚀 Sparked Game API running");
});

// ---------------- START ----------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  // Seed admin user if not present
  (async () => {
    try {
      const email = "developerhridoy@gmail.com";
      let admin = await User.findOne({ email });
      if (!admin) {
        admin = await User.create({
          email,
          googleId: "seeded-admin",
          role: "admin",
          subscription: { status: "active", plan: null, stripeCustomerId: null, stripeSubscriptionId: null, expiresAt: null },
        });
        console.log("👑 Seeded admin user:", email);
      } else if (admin.role !== "admin") {
        admin.role = "admin";
        await admin.save();
        console.log("👑 Ensured admin role for:", email);
      }
    } catch (e) {
      console.error("Admin seeding failed:", e);
    }
  })();
});
