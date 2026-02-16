import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import socketService from "../services/socket";
import { gameAPI } from "../services/api";

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
};

export const GameProvider = ({ children, user }) => {
  const [state, setState] = useState({
    gameId: null,
    playerId: null,
    game: null,
    status: "loading",
    pendingDraw: null,
  });
  const [chat, setChat] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketInitialized = useRef(false);
  const isExiting = useRef(false);
  const isReconnecting = useRef(false);

  // ===== RECONNECT ON PAGE LOAD =====
  useEffect(() => {
    const initGame = async () => {
      const savedGameId = localStorage.getItem("sparked_gameId");
      const savedPlayerId = localStorage.getItem("sparked_playerId");

      console.log("🔍 Checking for saved game:", savedGameId, savedPlayerId);

      if (savedGameId && savedPlayerId) {
        isReconnecting.current = true;
        await reconnectToGame(savedGameId, savedPlayerId);
        isReconnecting.current = false;
      } else {
        setState((prev) => ({ ...prev, status: "menu" }));
      }
    };

    initGame();
  }, []);

  // ===== SOCKET SETUP =====
  useEffect(() => {
    if (socketInitialized.current || !state.gameId) return;

    console.log("🔌 Initializing socket for game:", state.gameId);
    socketInitialized.current = true;

    const socket = socketService.connect();

    const handleConnect = () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
      if (state.gameId && state.playerId) {
        socketService.joinRoom(state.gameId, state.playerId, user?.role || "free");
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    };

    const handleGameState = ({ game }) => {
      if (!game || isExiting.current) return;

      console.log("📦 Received game state update");

      let newStatus = "waiting";
      if (game.winner) {
        newStatus = "finished";
      } else if (game.player2) {
        newStatus = "playing";
      }

      setState((prev) => ({
        ...prev,
        game,
        status: newStatus,
      }));
      setChat(game.chat || []);
    };

    const handlePlayerJoined = () => {
      console.log("👤 Player joined event received");
      refreshGame();
    };

    const handlePlayerLeft = () => {
      if (isExiting.current) return;
      isExiting.current = true;
      alert("Partner left the game");
      forceExit();
    };

    const handleGameDeleted = () => {
      if (isExiting.current) return;
      isExiting.current = true;
      alert("Game ended");
      forceExit();
    };

    const handleNewMessage = ({ message }) => {
      setChat((prev) => [...prev, message]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("gameState", handleGameState);
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    socket.on("gameDeleted", handleGameDeleted);
    socket.on("newMessage", handleNewMessage);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("gameState", handleGameState);
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
      socket.off("gameDeleted", handleGameDeleted);
      socket.off("newMessage", handleNewMessage);
      socketInitialized.current = false;
    };
  }, [state.gameId, state.playerId, user?.role]);

  // ===== RECONNECT FUNCTION =====
  const reconnectToGame = async (gameId, playerId) => {
    console.log("🔄 Reconnecting to game:", gameId);

    try {
      const res = await gameAPI.getGame(gameId);

      if (res.game) {
        const isPlayer1 = playerId === "player1";
        const playerData = isPlayer1 ? res.game.player1 : res.game.player2;

        if (!playerData) {
          console.log("❌ Player not found in game");
          clearGameData();
          return;
        }

        const newStatus = res.game.winner
          ? "finished"
          : res.game.player2
            ? "playing"
            : "waiting";

        console.log("✅ Reconnected! Status:", newStatus);

        setState({
          gameId,
          playerId,
          game: res.game,
          status: newStatus,
          pendingDraw: null,
        });
        setChat(res.game.chat || []);

        const socket = socketService.connect();
        const joinRoom = () => {
          console.log("🔌 Joining room after reconnect");
          socketService.joinRoom(gameId, playerId, user?.role || "free");
        };

        if (socket.connected) {
          joinRoom();
        } else {
          socket.once("connect", joinRoom);
        }
      } else {
        console.log("❌ Game not found");
        clearGameData();
      }
    } catch (error) {
      console.error("❌ Reconnect error:", error);
      clearGameData();
    }
  };

  const clearGameData = () => {
    localStorage.removeItem("sparked_gameId");
    localStorage.removeItem("sparked_playerId");
    setState({
      gameId: null,
      playerId: null,
      game: null,
      status: "menu",
      pendingDraw: null,
    });
    setChat([]);
  };

  // ===== REFRESH GAME =====
  const refreshGame = async () => {
    if (!state.gameId || isExiting.current) return;

    try {
      console.log("🔄 Refreshing game state...");
      const res = await gameAPI.getGame(state.gameId);

      if (res.game) {
        const newStatus = res.game.winner
          ? "finished"
          : res.game.player2
            ? "playing"
            : "waiting";

        setState((prev) => ({
          ...prev,
          game: res.game,
          status: newStatus,
        }));
        setChat(res.game.chat || []);
        console.log("✅ Game refreshed, status:", newStatus);
      } else {
        console.log("❌ Game no longer exists");
        clearGameData();
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  };

  // ===== FORCE EXIT =====
  const forceExit = useCallback(() => {
    console.log("🚪 Force exiting...");
    socketService.disconnect();
    clearGameData();
    socketInitialized.current = false;
    isExiting.current = false;
    window.location.href = "/";
  }, []);

  // ===== CREATE GAME =====
  const createGame = async (playerName) => {
    console.log("🎮 Creating game for:", playerName);
    const res = await gameAPI.createGame(playerName);

    if (!res.success) {
      throw new Error("Failed to create game");
    }

    console.log("✅ Game created:", res.gameId);
    localStorage.setItem("sparked_gameId", res.gameId);
    localStorage.setItem("sparked_playerId", res.playerId);

    setState({
      gameId: res.gameId,
      playerId: res.playerId,
      game: res.game,
      status: "waiting",
      pendingDraw: null,
    });

    const socket = socketService.connect();
    const joinRoom = () => {
      console.log("🔌 Joining socket room:", res.gameId);
      socketService.joinRoom(res.gameId, res.playerId, user?.role || "free");
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return res;
  };

  // ===== JOIN GAME =====
  const joinGame = async (gameId, playerName) => {
    console.log("🎮 Joining game:", gameId, "as:", playerName);
    const res = await gameAPI.joinGame(gameId, playerName);

    if (!res.success) {
      throw new Error("Failed to join game");
    }

    console.log("✅ Joined game:", res.gameId);
    localStorage.setItem("sparked_gameId", res.gameId);
    localStorage.setItem("sparked_playerId", res.playerId);

    setState({
      gameId: res.gameId,
      playerId: res.playerId,
      game: res.game,
      status: "playing",
      pendingDraw: null,
    });
    setChat(res.game.chat || []);

    const socket = socketService.connect();
    const joinRoom = () => {
      console.log("🔌 Joining socket room:", res.gameId);
      socketService.joinRoom(res.gameId, res.playerId, user?.role || "free");
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return res;
  };

  // ===== PLAY CARD =====
  const playCard = async (card) => {
    const { game, gameId, playerId } = state;

    if (!game) throw new Error("No game");
    if (game.turn !== playerId) throw new Error("Not your turn");
    if (game.verify) throw new Error("Verification pending");
    if (game.needsColorPick) throw new Error("Pick a color first");

    const topCard = game.discard[game.discard.length - 1];
    const isValidPlay =
      card.color === "wild" ||
      card.color === game.spark ||
      card.value === topCard.value;

    if (!isValidPlay) {
      throw new Error("Card does not match");
    }

    const res = await gameAPI.playCard(gameId, playerId, card.uid);
    if (res?.success && res?.game) {
      const newStatus = res.game.winner
        ? "finished"
        : res.game.player2
        ? "playing"
        : "waiting";
      setState((prev) => ({ ...prev, game: res.game, status: newStatus }));
      setChat(res.game.chat || []);
    }
    return res;
  };

  // ===== OTHER ACTIONS =====
  const submitProof = async (url, type) => {
    const res = await gameAPI.submitProof(state.gameId, state.playerId, url, type);
    if (res?.success && res?.game) {
      const newStatus = res.game.winner
        ? "finished"
        : res.game.player2
        ? "playing"
        : "waiting";
      setState((prev) => ({ ...prev, game: res.game, status: newStatus }));
      setChat(res.game.chat || []);
    }
    return res;
  };

  const skipProof = async () => {
    const res = await gameAPI.skipProof(state.gameId, state.playerId);
    if (res?.success && res?.game) {
      const newStatus = res.game.winner
        ? "finished"
        : res.game.player2
        ? "playing"
        : "waiting";
      setState((prev) => ({ ...prev, game: res.game, status: newStatus }));
      setChat(res.game.chat || []);
    }
    return res;
  };

  const verifyChallenge = async (success) => {
    const res = await gameAPI.verifyChallenge(state.gameId, state.playerId, success);
    if (res?.success && res?.game) {
      const newStatus = res.game.winner
        ? "finished"
        : res.game.player2
        ? "playing"
        : "waiting";
      setState((prev) => ({ ...prev, game: res.game, status: newStatus }));
      setChat(res.game.chat || []);
    }
    return res;
  };

  const pickColor = async (color) => {
    const res = await gameAPI.pickColor(state.gameId, state.playerId, color);
    if (res?.success && res?.game) {
      const newStatus = res.game.winner
        ? "finished"
        : res.game.player2
        ? "playing"
        : "waiting";
      setState((prev) => ({ ...prev, game: res.game, status: newStatus }));
      setChat(res.game.chat || []);
    }
    return res;
  };

  const drawCard = async () => {
    const { game, gameId, playerId } = state;

    if (!game || game.turn !== playerId || game.verify || game.needsColorPick)
      return null;

    const res = await gameAPI.drawCard(gameId, playerId);
    if (res?.success) {
      if (res.card) {
        setState((prev) => ({ ...prev, pendingDraw: res.card }));
      }
      if (res.game) {
        const newStatus = res.game.winner
          ? "finished"
          : res.game.player2
          ? "playing"
          : "waiting";
        setState((prev) => ({ ...prev, game: res.game, status: newStatus }));
        setChat(res.game.chat || []);
      }
    }
    return res;
  };

  const addDrawnCardToHand = async (card) => {
    try {
      const res = await gameAPI.addToHand(state.gameId, state.playerId, card);
      setState((prev) => ({ ...prev, pendingDraw: null }));
      if (res?.success && res?.game) {
        const newStatus = res.game.winner
          ? "finished"
          : res.game.player2
          ? "playing"
          : "waiting";
        setState((prev) => ({ ...prev, game: res.game, status: newStatus }));
        setChat(res.game.chat || []);
      }
      return res;
    } catch (error) {
      console.error("Add to hand error:", error);
      setState((prev) => ({ ...prev, pendingDraw: null }));
      throw error;
    }
  };

  const sendMessage = (text, type = "text", url = null) => {
    if (state.gameId && state.playerId) {
      socketService.sendMessage(state.gameId, state.playerId, text, type, url);
    }
  };

  const uploadMedia = async (file) => {
    return await gameAPI.uploadMedia(file);
  };

  // ===== EXIT GAME =====
  const exitGame = useCallback(
    async (deleteGame = false) => {
      if (isExiting.current) return;
      isExiting.current = true;

      const { gameId, playerId } = state;

      if (gameId && playerId) {
        socketService.emit("leaveRoom", { gameId, playerId });
      }

      if (deleteGame && gameId) {
        try {
          await gameAPI.deleteGame(gameId);
        } catch (error) {
          console.error("Delete error:", error);
        }
      }

      socketService.disconnect();
      localStorage.removeItem("sparked_gameId");
      localStorage.removeItem("sparked_playerId");

      setState({
        gameId: null,
        playerId: null,
        game: null,
        status: "menu",
        pendingDraw: null,
      });
      setChat([]);
      socketInitialized.current = false;
      isExiting.current = false;
    },
    [state.gameId, state.playerId],
  );

  // ===== CONTEXT VALUE =====
  const value = {
    user, // <--- added user here
    gameId: state.gameId,
    playerId: state.playerId,
    game: state.game,
    status: state.status,
    pendingDraw: state.pendingDraw,
    chat,
    isConnected,
    createGame,
    joinGame,
    playCard,
    submitProof,
    skipProof,
    verifyChallenge,
    pickColor,
    drawCard,
    addDrawnCardToHand,
    sendMessage,
    uploadMedia,
    exitGame,
    refresh: refreshGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
