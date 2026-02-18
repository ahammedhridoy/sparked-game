const Game = require("../models/Game");

module.exports = (io) => {
  const gameRooms = new Map();
  const freeTimers = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinRoom", async ({ gameId, playerId, role, userId }) => {
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

        let endsAtFromDb = null;
        if (userId) {
          try {
            const user = await require("../models/User").findById(userId);
            if (
              user &&
              (!user.freePlayEndsAt || isNaN(new Date(user.freePlayEndsAt)))
            ) {
              user.freePlayEndsAt = new Date(now + 10 * 60 * 1000);
              await user.save();
              endsAtFromDb = user.freePlayEndsAt.getTime();
              console.log(
                `⏳ Set DB freePlayEndsAt for ${
                  user.email
                } -> ${user.freePlayEndsAt.toISOString()}`
              );
            } else if (user && user.freePlayEndsAt) {
              endsAtFromDb = new Date(user.freePlayEndsAt).getTime();
            }
          } catch (e) {
            console.warn("Free timer DB check failed:", e?.message || e);
          }
        }

        let endTime =
          endsAtFromDb ||
          (freeTimers.get(key)?.endTime ?? now + 10 * 60 * 1000);
        let entry = freeTimers.get(key) || { endTime, timeout: null };
        entry.endTime = endTime;
        freeTimers.set(key, entry);

        const remaining = Math.max(0, endTime - now);
        if (entry.timeout) clearTimeout(entry.timeout);

        if (remaining === 0) {
          console.log(`⏰ Timer already expired for ${key}`);
          socket.emit("freeTimeExpired");
          freeTimers.delete(key);
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
