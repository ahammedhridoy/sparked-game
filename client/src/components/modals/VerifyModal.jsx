import React, { useState, useRef, useEffect, useCallback } from "react";
import { useGame } from "../../context/GameContext";

const VerifyModal = () => {
  const { game, playerId, verifyChallenge } = useGame();
  const [verifying, setVerifying] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const mountedRef = useRef(true);

  // Check if we should show the modal
  const verify = game?.verify;
  const shouldShow =
    verify?.target === playerId &&
    verify?.status === "pending" &&
    verify?.proofUrl;

  const proofUrl = verify?.proofUrl || "";
  const proofType = verify?.proofType || "video";
  const card = verify?.card;

  // Build the media URL
  const getMediaUrl = useCallback(() => {
    if (!proofUrl) return "";

    let url = proofUrl;

    // Ensure URL starts with /
    if (!url.startsWith("/") && !url.startsWith("http")) {
      url = `${import.meta.env.VITE_BACKEND_URL}/${url}`;
    }

    // Add cache buster if retrying
    if (retryCount > 0) {
      url += (url.includes("?") ? "&" : "?") + "_t=" + Date.now();
    }

    return url;
  }, [proofUrl, retryCount]);

  const mediaUrl = getMediaUrl();

  // Reset state when modal opens/closes or URL changes
  useEffect(() => {
    if (shouldShow) {
      console.log("🎬 VerifyModal opened, URL:", mediaUrl);
      setMediaReady(false);
      setMediaError(false);
      setVerifying(false);
    }
  }, [shouldShow, proofUrl]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load media when URL is ready
  useEffect(() => {
    if (!shouldShow || !mediaUrl) return;

    const loadMedia = () => {
      if (proofType === "video" && videoRef.current) {
        console.log("📹 Loading video:", mediaUrl);
        videoRef.current.src = mediaUrl;
        videoRef.current.load();
      } else if (proofType === "audio" && audioRef.current) {
        console.log("🎵 Loading audio:", mediaUrl);
        audioRef.current.src = mediaUrl;
        audioRef.current.load();
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadMedia, 200);
    return () => clearTimeout(timer);
  }, [shouldShow, mediaUrl, proofType, retryCount]);

  // Don't render if shouldn't show
  if (!shouldShow) {
    return null;
  }

  const handleMediaCanPlay = () => {
    console.log("✅ Media can play");
    if (mountedRef.current) {
      setMediaReady(true);
      setMediaError(false);
    }
  };

  const handleMediaError = (e) => {
    console.error("❌ Media error:", e);
    if (mountedRef.current) {
      setMediaError(true);
      setMediaReady(false);
    }
  };

  const handleRetry = () => {
    console.log("🔄 Retrying media load...");
    setMediaError(false);
    setMediaReady(false);
    setRetryCount((prev) => prev + 1);
  };

  const handleVerify = async (success) => {
    if (verifying) return;

    try {
      console.log("✅ Verifying:", success);
      setVerifying(true);
      await verifyChallenge(success);
      // Modal will close automatically when game state updates
    } catch (error) {
      console.error("Verify error:", error);
      alert("Failed to verify. Please try again.");
      if (mountedRef.current) {
        setVerifying(false);
      }
    }
  };

  const cardBgColors = {
    joy: "rgba(241, 196, 15, 0.2)",
    passion: "rgba(231, 76, 60, 0.2)",
    care: "rgba(52, 152, 219, 0.2)",
    growth: "rgba(39, 174, 96, 0.2)",
    wild: "rgba(155, 89, 182, 0.2)",
  };

  const cardBg = cardBgColors[card?.color] || "rgba(255,255,255,0.1)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.95)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(145deg, #1a1a2e, #252538)",
          borderRadius: 24,
          padding: 25,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, color: "#2ecc71", margin: 0 }}>
            🔍 Verify Task
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              marginTop: 5,
              fontSize: 14,
            }}
          >
            Did your partner complete this task?
          </p>
        </div>

        {/* Task Card */}
        <div
          style={{
            background: cardBg,
            padding: 16,
            borderRadius: 14,
            marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h3 style={{ fontSize: 18, margin: 0, textAlign: "center" }}>
            {card?.title}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              marginTop: 8,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            {card?.text}
          </p>
        </div>

        {/* Media Section */}
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            📎 Partner's Proof:
          </p>

          <div
            style={{
              background: "#000",
              borderRadius: 16,
              overflow: "hidden",
              border: "2px solid rgba(46, 204, 113, 0.4)",
              minHeight: 120,
              position: "relative",
            }}
          >
            {/* Video Player */}
            {proofType === "video" && (
              <>
                {/* Loading State */}
                {!mediaReady && !mediaError && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#000",
                      zIndex: 5,
                    }}
                  >
                    <div style={{ fontSize: 36 }} className="animate-pulse">
                      📹
                    </div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 10,
                        fontSize: 13,
                      }}
                    >
                      Loading video...
                    </p>
                  </div>
                )}

                {/* Error State */}
                {mediaError && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#000",
                      zIndex: 5,
                      padding: 20,
                    }}
                  >
                    <p
                      style={{
                        color: "#e74c3c",
                        marginBottom: 15,
                        fontSize: 14,
                      }}
                    >
                      ⚠️ Video failed to load
                    </p>
                    <button
                      onClick={handleRetry}
                      style={{
                        background: "#3498db",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: "bold",
                        marginBottom: 10,
                      }}
                    >
                      🔄 Retry
                    </button>
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#3498db", fontSize: 12 }}
                    >
                      Open in new tab
                    </a>
                  </div>
                )}

                <video
                  ref={videoRef}
                  controls
                  playsInline
                  preload="auto"
                  onCanPlay={handleMediaCanPlay}
                  onLoadedData={handleMediaCanPlay}
                  onError={handleMediaError}
                  style={{
                    width: "100%",
                    maxHeight: 280,
                    display: mediaReady ? "block" : "block",
                    opacity: mediaReady ? 1 : 0,
                    transition: "opacity 0.3s",
                  }}
                >
                  <source src={mediaUrl} type="video/mp4" />
                  <source src={mediaUrl} type="video/webm" />
                  <source src={mediaUrl} type="video/quicktime" />
                </video>
              </>
            )}

            {/* Audio Player */}
            {proofType === "audio" && (
              <div style={{ padding: 25, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 15 }}>🎵</div>

                {!mediaReady && !mediaError && (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 10,
                      fontSize: 13,
                    }}
                  >
                    Loading audio...
                  </p>
                )}

                {mediaError && (
                  <div style={{ marginBottom: 15 }}>
                    <p style={{ color: "#e74c3c", marginBottom: 10 }}>
                      ⚠️ Audio failed to load
                    </p>
                    <button
                      onClick={handleRetry}
                      style={{
                        background: "#3498db",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      🔄 Retry
                    </button>
                  </div>
                )}

                <audio
                  ref={audioRef}
                  controls
                  preload="auto"
                  onCanPlay={handleMediaCanPlay}
                  onLoadedData={handleMediaCanPlay}
                  onError={handleMediaError}
                  style={{
                    width: "100%",
                    opacity: mediaReady ? 1 : 0.5,
                  }}
                >
                  <source src={mediaUrl} type="audio/mpeg" />
                  <source src={mediaUrl} type="audio/mp4" />
                  <source src={mediaUrl} type="audio/wav" />
                </audio>
              </div>
            )}
          </div>
        </div>

        {/* Verify Buttons - ALWAYS SHOW */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 15,
            }}
          >
            Did they complete the task?
          </p>

          {verifying ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 32 }} className="animate-pulse">
                ⏳
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 10 }}>
                Processing...
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
                <button
                  onClick={() => handleVerify(true)}
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                    color: "white",
                    fontSize: 18,
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(46, 204, 113, 0.3)",
                  }}
                >
                  ✅ YES
                </button>
                <button
                  onClick={() => handleVerify(false)}
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                    color: "white",
                    fontSize: 18,
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(231, 76, 60, 0.3)",
                  }}
                >
                  ❌ NO
                </button>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                NO = Partner draws 2 penalty cards
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyModal;
