const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    id: String,
    uid: String,
    color: String,
    value: String,
    title: String,
    text: String,
    type: String,
    effect: String,
  },
  { _id: false },
);

const playerSchema = new mongoose.Schema(
  {
    name: String,
    odId: String,
    hand: [cardSchema],
    count: { type: Number, default: 7 },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    sender: String,
    text: String,
    type: { type: String, default: "text" },
    url: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const verifySchema = new mongoose.Schema(
  {
    target: String,
    from: String,
    card: cardSchema,
    proofUrl: String,
    proofType: String,
    status: { type: String, default: "pending" },
  },
  { _id: false },
);

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  player1: playerSchema,
  player2: playerSchema,
  p2Temp: [cardSchema],
  deck: [cardSchema],
  discard: [cardSchema],
  turn: String,
  spark: String,
  chat: [messageSchema],
  verify: verifySchema,
  winner: String,
  needsColorPick: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["waiting", "playing", "finished"],
    default: "waiting",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // 24 hours
  },
});

module.exports = mongoose.model("Game", gameSchema);
