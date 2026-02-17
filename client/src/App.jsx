import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GameProvider, useGame } from "./context/GameContext";
import api from "./services/api";
import MenuScreen from "./pages/MenuScreen";
import CreateGameScreen from "./pages/CreateGameScreen";
import JoinGameScreen from "./pages/JoinGameScreen";
import WaitingScreen from "./pages/WaitingScreen";
import GameScreen from "./pages/GameScreen";
import RulesScreen from "./pages/RulesScreen";
import AdminDashboard from "./pages/AdminDashboard";
import GamesPage from "./pages/GamesPage";
import PlayersPage from "./pages/PlayersPage";
import ChatsPage from "./pages/ChatsPage";
import { CheckoutSuccess, CheckoutCancel } from "./pages/CheckoutResult";

// Loading component
const LoadingScreen = () => (
  <div className="screen-layout">
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 50 }} className="animate-pulse">
        ✨
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 20 }}>
        Loading...
      </p>
    </div>
  </div>
);

// Router with game state awareness
const AppRoutes = ({ user, onLogin, onLogout, onUserUpdate }) => {
  const { status, gameId } = useGame();

  // Show loading while checking for saved game
  if (status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* -------- ADMIN ROUTES -------- */}
      <Route
        path="/admin"
        element={
          user?.role === "admin" ? (
            <AdminDashboard />)
           : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/admin/games"
        element={
          user?.role === "admin" ? <GamesPage /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/admin/players"
        element={
          user?.role === "admin" ? (
            <PlayersPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/admin/chats"
        element={
          user?.role === "admin" ? <ChatsPage /> : <Navigate to="/" replace />
        }
      />

      {/* Stripe checkout results */}
      <Route path="/success" element={<CheckoutSuccess onUserUpdate={onUserUpdate} />} />
      <Route path="/cancel" element={<CheckoutCancel />} />

      <Route
        path="/"
        element={
          status === "menu" ? (
            <MenuScreen user={user} onLogin={onLogin} onLogout={onLogout} />
          ) : status === "waiting" ? (
            <Navigate to="/waiting" replace />
          ) : status === "playing" ? (
            <Navigate to="/game" replace />
          ) : (
            <MenuScreen user={user} onLogin={onLogin} onLogout={onLogout} />
          )
        }
      />

      {/* Create game */}
      <Route
        path="/create"
        element={
          !user ? (
            <Navigate to="/" replace />
          ) : gameId ? (
            <Navigate to="/waiting" replace />
          ) : (
            <CreateGameScreen />
          )
        }
      />

      {/* Join game */}
      <Route
        path="/join"
        element={
          !user ? (
            <Navigate to="/" replace />
          ) : status === "playing" ? (
            <Navigate to="/game" replace />
          ) : gameId ? (
            <Navigate to="/waiting" replace />
          ) : (
            <JoinGameScreen />
          )
        }
      />

      {/* Waiting room */}
      <Route
        path="/waiting"
        element={
          !user ? (
            <Navigate to="/" replace />
          ) : status === "playing" ? (
            <Navigate to="/game" replace />
          ) : status === "waiting" && gameId ? (
            <WaitingScreen />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Game screen */}
      <Route
        path="/game"
        element={
          !user ? (
            <Navigate to="/" replace />
          ) : status === "playing" && gameId ? (
            <GameScreen />
          ) : status === "waiting" ? (
            <Navigate to="/waiting" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Rules - always accessible */}
      <Route path="/rules" element={<RulesScreen />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("sparked_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    try {
      localStorage.setItem("sparked_user", JSON.stringify(nextUser));
      localStorage.removeItem("sparked_free_expired");
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("sparked_user");
    localStorage.removeItem("sparked_free_expired");
  };

  const handleUserUpdate = (u) => {
    setUser(u);
  };

  // Auto-logout if user removed from DB; refresh user on load
  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (!user?.id) return;
      try {
        const { data } = await api.get("/auth/me", { params: { id: user.id } });
        if (cancelled) return;
        const updated = data?.user;
        if (updated) {
          localStorage.setItem("sparked_user", JSON.stringify(updated));
          // Only update state when identity stays same but fields change
          if (updated.id === user.id) {
            setUser((prev) => ({ ...prev, ...updated }));
          }
        }
      } catch (e) {
        if (e?.response?.status === 404) {
          setUser(null);
          localStorage.removeItem("sparked_user");
          localStorage.removeItem("sparked_free_expired");
        }
      }
    };
    validate();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <GameProvider user={user}>
      <Router>
        <AppRoutes user={user} onLogin={handleLogin} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      </Router>
    </GameProvider>
  );
}

export default App;
