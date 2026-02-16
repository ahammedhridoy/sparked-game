import React, { useState, useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";

const ChatWindow = ({ isOpen, onClose }) => {
  const { chat, playerId, sendMessage, uploadMedia } = useGame();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Determine file type
    let type = "file";
    if (file.type.startsWith("video/")) type = "video";
    else if (file.type.startsWith("audio/")) type = "audio";
    else if (file.type.startsWith("image/")) type = "image";

    try {
      setUploading(true);
      setUploadType(type);
      const result = await uploadMedia(file);
      if (result.success) {
        sendMessage(`Sent ${result.type}`, result.type, result.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
      setUploadType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const renderMediaContent = (msg) => {
    // Derive backend origin from VITE_API_URL or sensible fallback
    const apiBase = (import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001/api`).replace(/\/$/, "");
    const originBase = apiBase.replace(/\/api$/, "");

    switch (msg.type) {
      case "video":
        return (
          <div className="chat-media-container">
            <video
              controls
              playsInline
              preload="metadata"
              className="chat-video"
              src={`${originBase}${msg.url}`}
            >
              Your browser does not support the video tag.
            </video>
            <div className="chat-media-label">
              <span>🎬</span> Video
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="chat-audio-container">
            <div className="chat-audio-icon">🎵</div>
            <div className="chat-audio-content">
              <div className="chat-audio-label">Voice Message</div>
              <audio
                controls
                preload="metadata"
                className="chat-audio"
                src={`${originBase}${msg.url}`}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="chat-media-container">
            <img
              src={`${originBase}${msg.url}`}
              alt="Shared image"
              className="chat-image"
              onClick={() => window.open(`${originBase}${msg.url}`, "_blank")}
            />
            <div className="chat-media-label">
              <span>📷</span> Photo
            </div>
          </div>
        );

      default:
        return <span>{msg.text}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="chat-overlay" onClick={onClose} />

      {/* Chat window */}
      <div className="chat-window">
        <div className="chat-header">
          <h3>💬 Chat</h3>
          <button onClick={onClose} className="chat-close-btn">
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {chat.length === 0 && (
            <div className="chat-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <p>No messages yet</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Start the conversation!
              </p>
            </div>
          )}

          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${msg.sender === playerId ? "sent" : "received"} ${msg.type && msg.type !== "text" ? "media" : ""}`}
            >
              {renderMediaContent(msg)}
            </div>
          ))}

          {/* Upload progress indicator */}
          {uploading && (
            <div className="chat-bubble sent uploading">
              <div className="chat-upload-progress">
                <span className="chat-upload-icon">
                  {uploadType === "video" && "🎬"}
                  {uploadType === "audio" && "🎵"}
                  {uploadType === "image" && "📷"}
                  {!uploadType && "📎"}
                </span>
                <span>Uploading {uploadType}...</span>
                <div className="chat-upload-spinner"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            accept="video/*,audio/*,image/*"
            hidden
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="chat-attach-btn"
            disabled={uploading}
          >
            {uploading ? "⏳" : "📎"}
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            disabled={uploading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!message.trim() || uploading}
          >
            ➤
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatWindow;
