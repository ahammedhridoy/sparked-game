import React, { useEffect, useState } from "react";
import { useGame } from "../../context/GameContext";

const ColorPickerModal = () => {
  const { game, playerId, pickColor } = useGame();
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    if (game?.needsColorPick && game?.turn === playerId) {
      setLoading(false);
      setSelectedColor(null);
    }
  }, [game?.needsColorPick, game?.turn, playerId]);

  useEffect(() => {
    if (!loading) return;
    let timer = setTimeout(() => {
      if (game?.needsColorPick && game?.turn === playerId) {
        setLoading(false);
        setSelectedColor(null);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading, game?.needsColorPick, game?.turn, playerId]);

  if (!game?.needsColorPick || game?.turn !== playerId) return null;

  const handlePick = async (color) => {
    if (loading) return;

    try {
      setSelectedColor(color);
      setLoading(true);
      await pickColor(color);
    } catch (error) {
      console.error("Color pick error:", error);
      alert("Failed to pick color. Try again.");
      setLoading(false);
      setSelectedColor(null);
    }
  };

  const colors = [
    { name: "passion", label: "Passion", emoji: "❤️" },
    { name: "care", label: "Care", emoji: "💙" },
    { name: "growth", label: "Growth", emoji: "💚" },
    { name: "joy", label: "Joy", emoji: "💛" },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="color-picker-modal">
          <div className="color-picker-title">🎨</div>
          <h2 style={{ fontSize: 22, marginBottom: 8, fontWeight: 800 }}>
            Pick a Color
          </h2>
          <p className="color-picker-subtitle">
            Choose the next category to play
          </p>

          <div className="color-picker-grid">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => handlePick(c.name)}
                disabled={loading}
                className={`color-pick-btn ${c.name} ${
                  selectedColor === c.name ? "selected" : ""
                }`}
              >
                {loading && selectedColor === c.name ? (
                  <>
                    <span className="color-pick-emoji" style={{ opacity: 0.5 }}>
                      ⏳
                    </span>
                    <span>Selecting...</span>
                  </>
                ) : (
                  <>
                    <span className="color-pick-emoji">{c.emoji}</span>
                    <span>{c.label}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {loading && (
            <p
              style={{
                marginTop: 20,
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Setting color...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorPickerModal;
