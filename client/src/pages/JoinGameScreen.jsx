import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

const JoinGameScreen = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { joinGame } = useGame();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!code.trim() || code.length !== 4) {
      setError("Please enter a valid 4-digit code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Attempting to join game:", code);
      const result = await joinGame(code.trim(), name.trim());
      console.log("Join result:", result);

      if (result && result.success) {
        console.log("Join successful, navigating to /game");
        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          navigate("/game", { replace: true });
        }, 100);
      } else {
        setError("Failed to join game");
        setLoading(false);
      }
    } catch (err) {
      console.error("Join error:", err);
      setError(err.response?.data?.error || err.message || "Game not found");
      setLoading(false);
    }
  };

  return (
    <div className="screen-layout">
      <div className="menu-container">
        <h2 style={{ fontSize: 24, marginBottom: 25 }}>🔗 Join Game</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            maxLength={15}
            className="input-field"
            autoFocus
            disabled={loading}
          />

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4-Digit Code"
            maxLength={4}
            className="input-field"
            disabled={loading}
          />

          {error && <p className="error-text">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? "⏳ Joining..." : "✓ Join Room"}
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          className="btn btn-ghost"
          disabled={loading}
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default JoinGameScreen;
