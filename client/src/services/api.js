import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Debug logging
api.interceptors.response.use(
  (response) => {
    console.log("✅ API:", response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error.config?.url,
      error.response?.data || error.message,
    );
    return Promise.reject(error);
  },
);

export const gameAPI = {
  createGame: async (playerName) => {
    const res = await api.post("/game/create", { playerName });
    return res.data;
  },

  joinGame: async (gameId, playerName) => {
    const res = await api.post("/game/join", { gameId, playerName });
    return res.data;
  },

  getGame: async (gameId) => {
    const res = await api.get(`/game/${gameId}`);
    return res.data;
  },

  deleteGame: async (gameId) => {
    const res = await api.delete(`/game/${gameId}`);
    return res.data;
  },

  playCard: async (gameId, playerId, cardUid) => {
    const res = await api.post(`/game/${gameId}/play`, { playerId, cardUid });
    return res.data;
  },

  submitProof: async (gameId, playerId, proofUrl, proofType) => {
    // Ensure URL starts with /
    const cleanUrl = proofUrl.startsWith("/") ? proofUrl : "/" + proofUrl;
    const res = await api.post(`/game/${gameId}/submit-proof`, {
      playerId,
      proofUrl: cleanUrl,
      proofType,
    });
    return res.data;
  },

  skipProof: async (gameId, playerId) => {
    const res = await api.post(`/game/${gameId}/skip-proof`, { playerId });
    return res.data;
  },

  verifyChallenge: async (gameId, playerId, success) => {
    const res = await api.post(`/game/${gameId}/verify`, { playerId, success });
    return res.data;
  },

  pickColor: async (gameId, playerId, color) => {
    const res = await api.post(`/game/${gameId}/color`, { playerId, color });
    return res.data;
  },

  drawCard: async (gameId, playerId) => {
    const res = await api.post(`/game/${gameId}/draw`, { playerId });
    return res.data;
  },

  addToHand: async (gameId, playerId, card) => {
    const res = await api.post(`/game/${gameId}/add-to-hand`, {
      playerId,
      card,
    });
    return res.data;
  },

  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append("media", file);
    const res = await api.post("/game/upload/media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 min for uploads
    });
    return res.data;
  },
};

export default api;
