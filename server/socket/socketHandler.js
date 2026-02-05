const Game = require("../models/Game");

module.exports = (io) => {
  const gameRooms = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a game room
    socket.on("joinRoom", async ({ gameId, playerId }) => {
      console.log(`Player ${playerId} joining room ${gameId}`);

      socket.join(gameId);
      socket.gameId = gameId;
      socket.playerId = playerId;

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
        Array.from(gameRooms.get(gameId) || []),
      );
    });

    // Leave game room - FIXED
    socket.on("leaveRoom", ({ gameId, playerId }) => {
      console.log(`Player ${playerId} leaving room ${gameId}`);

      socket.leave(gameId);

      if (gameRooms.has(gameId)) {
        gameRooms.get(gameId).delete(playerId);
        if (gameRooms.get(gameId).size === 0) {
          gameRooms.delete(gameId);
        }
      }

      // Notify other players in the room
      socket.to(gameId).emit("playerLeft", { playerId });
    });

    // Game deleted event - FIXED
    socket.on("gameDeleted", ({ gameId }) => {
      console.log(`Game ${gameId} was deleted`);
      io.to(gameId).emit("gameDeleted");
    });

    // Real-time chat message
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
        if (game.chat.length > 100) {
          game.chat = game.chat.slice(-100);
        }

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

    // Request game refresh
    socket.on("refreshGame", async ({ gameId }) => {
      try {
        const game = await Game.findOne({ gameId });
        if (game) {
          socket.emit("gameState", { game: game.toObject() });
        }
      } catch (error) {
        console.error("Refresh game error:", error);
      }
    });

    // Disconnect handling - FIXED
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      if (socket.gameId && socket.playerId) {
        // Notify other players
        socket.to(socket.gameId).emit("playerDisconnected", {
          playerId: socket.playerId,
        });

        // Clean up room tracking
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
