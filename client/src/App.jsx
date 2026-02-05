import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GameProvider, useGame } from "./context/GameContext";
import MenuScreen from "./pages/MenuScreen";
import CreateGameScreen from "./pages/CreateGameScreen";
import JoinGameScreen from "./pages/JoinGameScreen";
import WaitingScreen from "./pages/WaitingScreen";
import GameScreen from "./pages/GameScreen";
import RulesScreen from "./pages/RulesScreen";

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
const AppRoutes = () => {
  const { status, gameId } = useGame();

  // Show loading while checking for saved game
  if (status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Menu - only if no game */}
      <Route
        path="/"
        element={
          status === "menu" ? (
            <MenuScreen />
          ) : status === "waiting" ? (
            <Navigate to="/waiting" replace />
          ) : status === "playing" ? (
            <Navigate to="/game" replace />
          ) : (
            <MenuScreen />
          )
        }
      />

      {/* Create game */}
      <Route
        path="/create"
        element={
          gameId ? <Navigate to="/waiting" replace /> : <CreateGameScreen />
        }
      />

      {/* Join game */}
      <Route
        path="/join"
        element={
          status === "playing" ? (
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
          status === "playing" ? (
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
          status === "playing" && gameId ? (
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
  return (
    <GameProvider>
      <Router>
        <AppRoutes />
      </Router>
    </GameProvider>
  );
}

export default App;
