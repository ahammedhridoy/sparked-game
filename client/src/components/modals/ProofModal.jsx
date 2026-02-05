import React, { useRef, useState } from "react";
import { useGame } from "../../context/GameContext";

const ProofModal = ({ card }) => {
  const { submitProof, skipProof, uploadMedia } = useGame();
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const handleUpload = async (file, type) => {
    try {
      setUploading(true);
      setStatus("Uploading...");

      console.log("📤 Uploading file:", file.name, type);

      const result = await uploadMedia(file);
      console.log("📤 Upload result:", result);

      if (result.success) {
        setStatus("Sending to partner...");

        // URL should already start with / from server
        await submitProof(result.url, type);
        console.log("✅ Proof submitted:", result.url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert("Failed to submit. Try again.");
      setUploading(false);
      setStatus("");
    }
  };

  const handleSkip = async () => {
    if (confirm("Skip task? You will draw 2 penalty cards.")) {
      try {
        setUploading(true);
        await skipProof();
      } catch (error) {
        alert("Failed");
        setUploading(false);
      }
    }
  };

  const cardBg =
    {
      joy: "rgba(241, 196, 15, 0.15)",
      passion: "rgba(231, 76, 60, 0.15)",
      care: "rgba(52, 152, 219, 0.15)",
      growth: "rgba(39, 174, 96, 0.15)",
    }[card?.color] || "rgba(255,255,255,0.05)";

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-card" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, marginBottom: 5 }}>🎯 Complete Task</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
            Record proof for your partner
          </p>

          <div
            style={{
              background: cardBg,
              padding: 20,
              borderRadius: 16,
              marginBottom: 25,
            }}
          >
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>{card?.title}</h3>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.5,
              }}
            >
              {card?.text}
            </p>
          </div>

          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            capture="user"
            hidden
            onChange={(e) =>
              e.target.files[0] && handleUpload(e.target.files[0], "video")
            }
          />
          <input
            ref={audioRef}
            type="file"
            accept="audio/*"
            capture
            hidden
            onChange={(e) =>
              e.target.files[0] && handleUpload(e.target.files[0], "audio")
            }
          />

          {uploading ? (
            <div style={{ padding: 40 }}>
              <div
                style={{ fontSize: 40, marginBottom: 15 }}
                className="animate-bounce"
              >
                📤
              </div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>{status}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => videoRef.current?.click()}
                className="btn btn-danger"
              >
                📹 Record Video
              </button>
              <button
                onClick={() => audioRef.current?.click()}
                className="btn btn-secondary"
              >
                🎤 Record Audio
              </button>
              <button onClick={handleSkip} className="btn btn-ghost">
                ❌ Skip (Draw 2 Cards)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProofModal;
