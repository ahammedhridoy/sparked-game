import React, { useState } from "react";
import Card from "../Card";
import { useGame } from "../../context/GameContext";

const CardModal = ({ card, isDiscard, onClose }) => {
  const { playCard, playerId, game } = useGame();
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    try {
      setLoading(true);
      const res = await playCard(card);
      // Give the UI a tick to render status change (e.g., proof/color pick modals)
      setTimeout(() => onClose(), 50);
    } catch (error) {
      alert(error.message || "Cannot play this card");
      setLoading(false);
    }
  };

  const isMyTurn = game?.turn === playerId;
  const canPlay = isMyTurn && !game?.verify && !game?.needsColorPick;

  const getGlowColor = () => {
    if (card.color === "wild") return "wild";
    return card.color || "wild";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Close X Button */}
        <button className="modal-close-x" onClick={onClose}>
          ✕
        </button>

        {/* Card with Glow Effect */}
        <div className="modal-card-container">
          <div className={`modal-card-glow ${getGlowColor()}`} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Card card={card} size="lg" disabled />
          </div>
        </div>

        {/* Labels */}
        {isDiscard && (
          <div className="modal-discard-label">📍 Current Discard</div>
        )}

        {!isDiscard && !isMyTurn && (
          <div className="modal-turn-info">Wait for your turn to play</div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          {!isDiscard && canPlay && (
            <button
              onClick={handlePlay}
              disabled={loading}
              className={`modal-play-btn ${loading ? "loading" : ""}`}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Playing...
                </>
              ) : (
                <>▶ Play Card</>
              )}
            </button>
          )}

          <button onClick={onClose} className="modal-close-btn">
            ← Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
