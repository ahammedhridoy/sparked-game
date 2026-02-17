import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

class SocketService {
  socket = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false,
    });

    this.socket.on("connect", () =>
      console.log("✅ Socket connected", this.socket.id)
    );
    this.socket.on("disconnect", (reason) =>
      console.log("❌ Socket disconnected", reason)
    );
    this.socket.on("connect_error", (err) =>
      console.error("Socket error", err.message)
    );

    // Let screens handle UI for free-time expiry; persist a flag only
    this.socket.on("freeTimeExpired", () => {
      try {
        localStorage.setItem("sparked_free_expired", "1");
      } catch {}
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(gameId, playerId, role) {
    if (this.socket?.connected) {
      this.socket.emit("joinRoom", { gameId, playerId, role });
    }
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }
  on(event, callback) {
    this.socket?.on(event, callback);
  }
  off(event, callback) {
    this.socket?.off(event, callback);
  }
  once(event, callback) {
    this.socket?.once(event, callback);
  }

  sendMessage(gameId, playerId, text, type = "text", url = null) {
    this.emit("chatMessage", { gameId, playerId, text, type, url });
  }
}

const socketService = new SocketService();
export { socketService };
export default socketService;
