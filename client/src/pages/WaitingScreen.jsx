import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

const WaitingScreen = () => {
  const { gameId, status, game, exitGame } = useGame();
  const navigate = useNavigate();

  // Auto-navigate when partner joins
  useEffect(() => {
    if (status === "playing" || (game && game.player2)) {
      console.log("✅ Partner joined! Going to game...");
      navigate("/game", { replace: true });
    }
  }, [status, game, navigate]);

  const handleCancel = () => {
    if (confirm("Cancel and delete game?")) {
      exitGame(true);
      navigate("/", { replace: true });
    }
  };

  if (!gameId) {
    return (
      <div className="screen-layout">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }} className="animate-pulse">
            ⏳
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 15 }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-layout">
      <div className="menu-container">
        <h2
          style={{
            fontSize: 20,
            marginBottom: 10,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Room Code
        </h2>

        <div className="code-display">{gameId}</div>

        <div className="waiting-dots">
          <div className="waiting-dot" />
          <div className="waiting-dot" />
          <div className="waiting-dot" />
        </div>

        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 25 }}>
          Share this code with your partner
        </p>

        <button onClick={handleCancel} className="btn btn-ghost">
          ✕ Cancel
        </button>
      </div>
    </div>
  );
};

export default WaitingScreen;
