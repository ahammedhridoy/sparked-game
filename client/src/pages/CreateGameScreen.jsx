import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

const CreateGameScreen = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { createGame } = useGame();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Creating game for:", name);
      const result = await createGame(name.trim());
      console.log("Create result:", result);

      if (result && result.success) {
        console.log("Create successful, navigating to /waiting");
        setTimeout(() => {
          navigate("/waiting", { replace: true });
        }, 100);
      } else {
        setError("Failed to create game");
        setLoading(false);
      }
    } catch (err) {
      console.error("Create error:", err);
      setError(err.message || "Failed to create game");
      setLoading(false);
    }
  };

  return (
    <div className="screen-layout">
      <div className="menu-container">
        <h2 style={{ fontSize: 24, marginBottom: 25 }}>🎲 Start Game</h2>

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

          {error && <p className="error-text">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "⏳ Creating..." : "✓ Create Room"}
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

export default CreateGameScreen;
