import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { socketService } from "../services/socket"; // import socket
import SubscribeButton from "../components/SubscribeButton";

import Card, { CardBack } from "../components/Card";
import ChatWindow from "../components/ChatWindow";
import CardModal from "../components/modals/CardModal";
import ProofModal from "../components/modals/ProofModal";
import VerifyModal from "../components/modals/VerifyModal";
import ColorPickerModal from "../components/modals/ColorPickerModal";
import ChallengeModal from "../components/modals/ChallengeModal";

const GameScreen = () => {
  const navigate = useNavigate();
  const {
    user,
    game,
    gameId,
    playerId,
    status,
    drawCard,
    exitGame,
    pendingDraw,
    refresh,
    player,
  } = useGame();

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDiscard, setIsDiscard] = useState(false);
  const [freeExpired, setFreeExpired] = useState(false);

  // ------------------- SOCKET -------------------
  useEffect(() => {
    if (!gameId || !playerId) return;

    const handleFreeExpired = () => {
      setFreeExpired(true);
      setChatOpen(false);
    };

    socketService.on("freeTimeExpired", handleFreeExpired);

    return () => {
      socketService.off("freeTimeExpired", handleFreeExpired);
    };
  }, [gameId, playerId]);
  // ----------------------------------------------

  // Connect socket & join room
  // (handled by GameContext)

  // Refresh on mount to ensure latest state
  useEffect(() => {
    if (gameId && !game) {
      console.log("🔄 No game data, refreshing...");
      refresh();
    }
  }, [gameId, game, refresh]);

  // Handle winner
  useEffect(() => {
    if (game?.winner) {
      const isWinner = game.winner === playerId;
      setTimeout(() => {
        alert(isWinner ? "🏆 YOU WON!" : "❤️ PARTNER WON!");
        exitGame(false);
        navigate("/", { replace: true });
      }, 500);
    }
  }, [game?.winner, playerId, exitGame, navigate]);

  // Loading state
  if (!game) {
    return (
      <div className="screen-layout">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }} className="animate-pulse">
            🎴
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 15 }}>
            Loading game...
          </p>
        </div>
      </div>
    );
  }

  // Game data
  const isPlayer1 = playerId === "player1";
  const myHand = isPlayer1 ? game.player1?.hand : game.player2?.hand;
  const oppCount = isPlayer1 ? game.player2?.count : game.player1?.count;
  const myName = isPlayer1 ? game.player1?.name : game.player2?.name;
  const oppName = isPlayer1 ? game.player2?.name : game.player1?.name;
  const isMyTurn = game.turn === playerId;
  const topCard = game.discard?.[game.discard.length - 1];

  // Status flags
  const needProof =
    game.verify?.from === playerId && game.verify?.status === "waiting_proof";
  const needVerify =
    game.verify?.target === playerId && game.verify?.status === "pending";
  const needColorPick = game.needsColorPick && game.turn === playerId;
  const waitingVerification =
    game.verify?.from === playerId && game.verify?.status === "pending";

  // Status message
  let statusText = "";
  let statusClass = "";

  if (needColorPick) {
    statusText = "🎨 Pick a Color";
    statusClass = "color-pick";
  } else if (needProof) {
    statusText = "📹 Record Your Proof";
    statusClass = "proof";
  } else if (needVerify) {
    statusText = "🔍 Verify Partner";
    statusClass = "verify";
  } else if (waitingVerification) {
    statusText = "⏳ Awaiting Verification";
    statusClass = "waiting";
  } else if (isMyTurn) {
    statusText = `Your Turn • ${(game.spark || "wild").toUpperCase()}`;
    statusClass = "your-turn";
  } else {
    statusText = "Partner's Turn";
    statusClass = "waiting";
  }

  const canInteract = isMyTurn && !game.verify && !game.needsColorPick && !freeExpired;

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsDiscard(false);
  };

  const handleDiscardClick = () => {
    if (topCard) {
      const displayCard = { ...topCard };
      if (topCard.color === "wild" && game.spark) {
        displayCard.displayColor = game.spark;
      }
      setSelectedCard(displayCard);
      setIsDiscard(true);
    }
  };

  const handleDraw = async () => {
    if (!canInteract) return;
    try {
      await drawCard();
    } catch (err) {
      console.error("Draw error:", err);
    }
  };

  const handleExit = () => {
    if (confirm("Exit game? This will end for both players.")) {
      exitGame(true);
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="game-wrapper">
      <div className="game-board">
        {/* Exit Button */}
        <button onClick={handleExit} className="exit-btn">
          ✕
        </button>

        {/* Opponent Section */}
        <div className="player-section">
          <div className="player-label">{oppName || "Partner"}</div>
          <div className="hand-row">
            {Array.from({ length: Math.min(oppCount || 0, 12) }).map((_, i) => (
              <div key={i} style={{ marginLeft: i > 0 ? -22 : 0, zIndex: i }}>
                <CardBack size="sm" />
              </div>
            ))}
            {(oppCount || 0) > 12 && (
              <span
                style={{
                  marginLeft: 8,
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 12,
                }}
              >
                +{oppCount - 12}
              </span>
            )}
          </div>
          <div className="card-count-badge">{oppCount || 0} cards</div>
        </div>

        {/* Center Section */}
        <div className="center-section">
          <div className="piles-row">
            {/* Draw Pile */}
            <div
              onClick={handleDraw}
              className={`deck-card ${!canInteract ? "disabled" : ""}`}
            >
              <span>DRAW</span>
            </div>

            {/* Discard Pile */}
            <div onClick={handleDiscardClick} style={{ cursor: "pointer" }}>
              {topCard ? (
                <Card
                  card={{
                    ...topCard,
                    color:
                      topCard.color === "wild"
                        ? game.spark || "wild"
                        : topCard.color,
                  }}
                  size="md"
                  disabled
                />
              ) : (
                <div className="deck-card">
                  <span>EMPTY</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Display */}
          <div className={`status-display ${statusClass}`}>{statusText}</div>
        </div>

        {/* Player Section */}
        <div className="player-section">
          <div className="player-label">{myName || "You"}</div>
          <div className="hand-row">
            {myHand?.map((card, i) => (
              <div
                key={card.uid}
                style={{ marginLeft: i > 0 ? -28 : 0, zIndex: i }}
              >
                <Card
                  card={card}
                  size="md"
                  onClick={() => handleCardClick(card)}
                  disabled={!canInteract}
                />
              </div>
            ))}
            {(!myHand || myHand.length === 0) && (
              <p style={{ color: "rgba(255,255,255,0.3)" }}>No cards</p>
            )}
          </div>
        </div>

        {/* Chat Button */}
        <button
          onClick={() => {
            if (freeExpired) {
              alert("Your free play time is over. Upgrade to continue!");
              return;
            }
            if (user?.role === "free") {
              alert("Subscribe to use chat!");
              return;
            }
            setChatOpen(!chatOpen);
          }}
          className="chat-toggle-btn"
        >
          💬
        </button>

        {/* Free time expired overlay */}
        {freeExpired && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 20,
              textAlign: "center",
            }}
          >
            <div
              style={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: 24,
                maxWidth: 420,
                width: "100%",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏰ Time's up!</div>
              <p style={{ opacity: 0.8, marginBottom: 16 }}>
                Your free 10-minute session has ended. Upgrade to VIP to keep
                playing without limits.
              </p>
              {user ? (
                <SubscribeButton userId={user.id} plan="1m" />
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/", { replace: true })}
                >
                  Login to Upgrade
                </button>
              )}
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate("/", { replace: true })}
                >
                  Exit to Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ChatWindow isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {selectedCard && (
        <CardModal
          card={selectedCard}
          isDiscard={isDiscard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {needProof && game.verify?.card && <ProofModal card={game.verify.card} />}

      <VerifyModal />
      <ColorPickerModal />
      <ChallengeModal />
    </div>
  );
};

export default GameScreen;
