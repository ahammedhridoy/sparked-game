const Game = require("../models/Game");

module.exports = (io) => {
  const gameRooms = new Map();
  const freeTimers = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinRoom", async ({ gameId, playerId, role }) => {
      console.log(`Player ${playerId} joining room ${gameId}`);

      socket.join(gameId);
      socket.gameId = gameId;
      socket.playerId = playerId;
      socket.role = role;

      if (!gameRooms.has(gameId)) {
        gameRooms.set(gameId, new Set());
      }
      gameRooms.get(gameId).add(playerId);

      const game = await Game.findOne({ gameId });
      if (game) {
        socket.emit("gameState", { game: game.toObject() });
        socket.to(gameId).emit("gameState", { game: game.toObject() });
        socket.to(gameId).emit("playerJoined", { playerId });
      }

      console.log(
        `Room ${gameId} players:`,
        Array.from(gameRooms.get(gameId) || [])
      );

      if (role === "free") {
        const key = `${gameId}:${playerId}`;
        const now = Date.now();
        let entry = freeTimers.get(key);

        if (!entry) {
          entry = { endTime: now + 10 * 60 * 1000, timeout: null };
          freeTimers.set(key, entry);
          console.log(`⏳ Started 10m timer for ${key}`);
        } else {
          console.log(`⏳ Resuming timer for ${key}`);
        }

        const remaining = Math.max(0, entry.endTime - now);
        if (entry.timeout) {
          clearTimeout(entry.timeout);
          entry.timeout = null;
        }

        if (remaining === 0) {
          console.log(`⏰ Timer already expired for ${key}`);
          socket.emit("freeTimeExpired");
        } else {
          entry.timeout = setTimeout(() => {
            console.log(`⏰ Free time expired for ${key}`);
            socket.emit("freeTimeExpired");
            freeTimers.delete(key);
          }, remaining);
        }
      }
    });

    // Leave game room
    socket.on("leaveRoom", ({ gameId, playerId }) => {
      console.log(`Player ${playerId} leaving room ${gameId}`);

      socket.leave(gameId);

      if (gameRooms.has(gameId)) {
        gameRooms.get(gameId).delete(playerId);
        if (gameRooms.get(gameId).size === 0) {
          gameRooms.delete(gameId);
        }
      }

      socket.to(gameId).emit("playerLeft", { playerId });
    });

    // Game deleted
    socket.on("gameDeleted", ({ gameId }) => {
      console.log(`Game ${gameId} was deleted`);
      io.to(gameId).emit("gameDeleted");
    });

    // Chat message
    socket.on("chatMessage", async ({ gameId, playerId, text, type, url }) => {
      try {
        const game = await Game.findOne({ gameId });
        if (!game) return;

        const message = {
          sender: playerId,
          text,
          type: type || "text",
          url,
          timestamp: new Date(),
        };

        game.chat.push(message);
        if (game.chat.length > 100) game.chat = game.chat.slice(-100);

        await game.save();
        io.to(gameId).emit("newMessage", { message });
      } catch (error) {
        console.error("Chat message error:", error);
      }
    });

    // Typing indicator
    socket.on("typing", ({ gameId, playerId }) => {
      socket.to(gameId).emit("partnerTyping", { playerId });
    });

    // Refresh game
    socket.on("refreshGame", async ({ gameId }) => {
      try {
        const game = await Game.findOne({ gameId });
        if (game) socket.emit("gameState", { game: game.toObject() });
      } catch (error) {
        console.error("Refresh game error:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      if (socket.gameId && socket.playerId) {
        socket.to(socket.gameId).emit("playerDisconnected", {
          playerId: socket.playerId,
        });

        if (gameRooms.has(socket.gameId)) {
          gameRooms.get(socket.gameId).delete(socket.playerId);
          if (gameRooms.get(socket.gameId).size === 0) {
            gameRooms.delete(socket.gameId);
          }
        }
      }
    });
  });
};
