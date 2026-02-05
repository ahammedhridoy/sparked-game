import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";

const ChallengeModal = () => {
  const { pendingDraw, addDrawnCardToHand } = useGame();
  const [loading, setLoading] = useState(false);
  const cardIdRef = useRef(null);

  // Reset loading when a NEW card is drawn (different card)
  useEffect(() => {
    if (pendingDraw) {
      // Check if this is a different card than before
      const newCardId = `${pendingDraw.title}-${pendingDraw.text}-${Date.now()}`;
      if (
        cardIdRef.current !== pendingDraw.id &&
        cardIdRef.current !== newCardId
      ) {
        setLoading(false);
        cardIdRef.current = pendingDraw.id || newCardId;
      }
    } else {
      // Reset when modal closes
      setLoading(false);
      cardIdRef.current = null;
    }
  }, [pendingDraw]);

  if (!pendingDraw) return null;

  const handleAdd = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await addDrawnCardToHand(pendingDraw);
      // Modal will auto-close when pendingDraw becomes null
    } catch (error) {
      console.error("Add to hand error:", error);
      alert("Failed to add card. Please try again.");
      setLoading(false);
    }
  };

  const cardColors = {
    joy: {
      bg: "rgba(241, 196, 15, 0.15)",
      border: "rgba(241, 196, 15, 0.5)",
      emoji: "💛",
    },
    passion: {
      bg: "rgba(231, 76, 60, 0.15)",
      border: "rgba(231, 76, 60, 0.5)",
      emoji: "❤️",
    },
    care: {
      bg: "rgba(52, 152, 219, 0.15)",
      border: "rgba(52, 152, 219, 0.5)",
      emoji: "💙",
    },
    growth: {
      bg: "rgba(39, 174, 96, 0.15)",
      border: "rgba(39, 174, 96, 0.5)",
      emoji: "💚",
    },
    wild: {
      bg: "rgba(155, 89, 182, 0.15)",
      border: "rgba(155, 89, 182, 0.5)",
      emoji: "🌈",
    },
  };

  const colorStyle = cardColors[pendingDraw.color] || {
    bg: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.3)",
    emoji: "🃏",
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🃏</div>
          <h2 style={{ fontSize: 22, marginBottom: 20, fontWeight: 800 }}>
            You Drew a Card!
          </h2>

          <div
            style={{
              background: colorStyle.bg,
              border: `2px solid ${colorStyle.border}`,
              padding: 22,
              borderRadius: 18,
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>
              {colorStyle.emoji}
            </div>
            <h3
              style={{
                fontSize: 18,
                marginBottom: 10,
                fontWeight: 700,
                color: "white",
              }}
            >
              {pendingDraw.title}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.5,
              }}
            >
              {pendingDraw.text}
            </p>
            {pendingDraw.value !== undefined && (
              <div
                style={{
                  marginTop: 14,
                  padding: "8px 16px",
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: 20,
                  display: "inline-block",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Points: {pendingDraw.value}
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span
                  className="animate-spin"
                  style={{ display: "inline-block" }}
                >
                  ⏳
                </span>{" "}
                Adding...
              </>
            ) : (
              <>✓ Add to Hand</>
            )}
          </button>

          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Card will be added to your hand
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;
