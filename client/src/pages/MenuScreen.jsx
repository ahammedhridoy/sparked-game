import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MenuScreen = () => {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Desktop)
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Listen for successful install
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      // Android/Desktop - show native prompt
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else if (isIOS) {
      // iOS - show instructions modal
      setShowIOSModal(true);
    } else {
      // Fallback
      alert("Open browser menu and tap 'Install App' or 'Add to Home Screen'");
    }
  };

  // Show install button if not installed and (has prompt OR is iOS)
  const showInstallButton = !isInstalled && (installPrompt || isIOS);

  return (
    <div className="screen-layout">
      <div className="menu-container">
        <h1 className="gradient-title">✨ SPARKED</h1>
        <p className="subtitle">Connection Card Game for Couples</p>

        {/* Install Button */}
        {showInstallButton && (
          <button
            onClick={handleInstall}
            className="install-btn animate-bounce"
          >
            <span className="install-btn-icon">📲</span>
            Install App
          </button>
        )}

        {/* Installed Badge */}
        {isInstalled && (
          <div className="installed-badge">
            <span>✓</span> App Installed
          </div>
        )}

        <button onClick={() => navigate("/create")} className="btn btn-primary">
          🎲 Start New Game
        </button>

        <button onClick={() => navigate("/join")} className="btn btn-secondary">
          🔗 Join Game
        </button>

        <button onClick={() => navigate("/rules")} className="btn btn-ghost">
          📖 Game Rules
        </button>

        <p className="version-text">v1.0.0</p>
      </div>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div
          className="ios-modal-overlay"
          onClick={() => setShowIOSModal(false)}
        >
          <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="ios-modal-close"
              onClick={() => setShowIOSModal(false)}
            >
              ✕
            </button>

            <div className="ios-modal-icon">📲</div>
            <h2>Install Sparked</h2>
            <p className="ios-modal-subtitle">
              Add to your home screen for the best experience
            </p>

            <div className="ios-steps">
              <div className="ios-step">
                <div className="ios-step-num">1</div>
                <div className="ios-step-text">
                  <span className="ios-step-icon">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                    </svg>
                  </span>
                  Tap the <strong>Share</strong> button
                </div>
              </div>

              <div className="ios-step">
                <div className="ios-step-num">2</div>
                <div className="ios-step-text">
                  <span className="ios-step-icon">⊕</span>
                  Tap <strong>"Add to Home Screen"</strong>
                </div>
              </div>

              <div className="ios-step">
                <div className="ios-step-num">3</div>
                <div className="ios-step-text">
                  <span className="ios-step-icon">✓</span>
                  Tap <strong>"Add"</strong> to confirm
                </div>
              </div>
            </div>

            <div className="ios-note">
              💡 Make sure you're using <strong>Safari</strong> browser
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setShowIOSModal(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuScreen;
