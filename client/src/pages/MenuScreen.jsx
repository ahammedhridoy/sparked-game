import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import GoogleLoginButton from "../components/GoogleLoginButton";
import SubscribeButton from "../components/SubscribeButton";

const MenuScreen = ({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const { status } = useGame();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const pricingRef = useRef(null);

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
    <div
      className="screen-layout"
      style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, display: "block", overflowY: "auto" }}
    >
      {/* Section 1: Game Buttons (100vh) */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="menu-container">
          <h1 className="gradient-title">✨ SPARKED</h1>
          <p className="subtitle">Connection Card Game for Couples</p>

          {/* Auth section */}
          {!user ? (
            <div style={{ marginBottom: 12 }}>
              <GoogleLoginButton onLogin={onLogin} />
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
                Signed in as {user.email || user.name}
              </div>
              <button className="btn btn-ghost" onClick={onLogout}>
                🚪 Logout
              </button>
            </div>
          )}

          {/* Install Button */}
          {showInstallButton && (
            <button onClick={handleInstall} className="install-btn animate-bounce">
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

          {/* Primary actions */}
          <button
            onClick={() => navigate("/create")}
            className="btn btn-primary"
            disabled={!user}
            title={!user ? "Login with Google to start" : undefined}
          >
            🎲 Start New Game
          </button>

          <button
            onClick={() => navigate("/join")}
            className="btn btn-secondary"
            disabled={!user}
            title={!user ? "Login with Google to join" : undefined}
          >
            🔗 Join Game
          </button>

          <button onClick={() => navigate("/rules")} className="btn btn-ghost">
            📖 Game Rules
          </button>

          <p className="version-text">v1.0.0</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-ghost" onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })}>See VIP Plans ↓</button>
          </div>
        </div>
      </section>

      {/* Section 2: Pricing (100vh, visible for all) */}
      <section ref={pricingRef} className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="pricing-header">Choose Your VIP Plan</div>

          <div className="pricing-grid">
            {/* Monthly */}
            <div className="plan-card">
              <div className="plan-badge">Monthly</div>
              <div className="plan-title">Basic</div>
              <div className="plan-price">
                <span className="plan-currency">$</span>4.99<span className="plan-period">/mo</span>
              </div>
              <ul className="plan-features">
                <li><span className="check">✓</span> Full VIP access</li>
                <li><span className="check">✓</span> Ad‑free experience</li>
                <li><span className="check">✓</span> Cancel anytime</li>
              </ul>
              {user ? (
                <SubscribeButton userId={user.id} plan="1m" label="Get Started" className="plan-cta" />
              ) : (
                <button className="plan-cta" onClick={() => setShowLoginPrompt(true)}>Get Started</button>
              )}
            </div>

            {/* 6 Months (featured style is annual in our app, but we’ll highlight this middle card for visual balance) */}
            <div className="plan-card plan-card--featured">
              <div className="plan-badge plan-badge--featured">6 Months</div>
              <div className="plan-title">Advanced</div>
              <div className="plan-price">
                <span className="plan-currency">$</span>27<span className="plan-period">/6mo</span>
                <div className="plan-subprice">$4.50 / month</div>
              </div>
              <ul className="plan-features plan-features--featured">
                <li><span className="check">✓</span> Save vs monthly</li>
                <li><span className="check">✓</span> Priority support</li>
                <li><span className="check">✓</span> All VIP features</li>
              </ul>
              {user ? (
                <SubscribeButton userId={user.id} plan="6m" label="Get Started" className="plan-cta plan-cta--featured" />
              ) : (
                <button className="plan-cta plan-cta--featured" onClick={() => setShowLoginPrompt(true)}>Get Started</button>
              )}
            </div>

            {/* 12 Months */}
            <div className="plan-card">
              <div className="plan-badge">12 Months</div>
              <div className="plan-title">Enterprise</div>
              <div className="plan-price">
                <span className="plan-currency">$</span>48<span className="plan-period">/yr</span>
                <div className="plan-subprice">$4.00 / month</div>
              </div>
              <ul className="plan-features">
                <li><span className="check">✓</span> Best price per month</li>
                <li><span className="check">✓</span> VIP features + updates</li>
                <li><span className="check">✓</span> Support the project</li>
              </ul>
              {user ? (
                <SubscribeButton userId={user.id} plan="12m" label="Get Started" className="plan-cta" />
              ) : (
                <button className="plan-cta" onClick={() => setShowLoginPrompt(true)}>Get Started</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="ios-modal-overlay" onClick={() => setShowIOSModal(false)}>
          <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ios-modal-close" onClick={() => setShowIOSModal(false)}>
              ✕
            </button>

            <div className="ios-modal-icon">📲</div>
            <h2>Install Sparked</h2>
            <p className="ios-modal-subtitle">Add to your home screen for the best experience</p>

            <div className="ios-steps">
              <div className="ios-step">
                <div className="ios-step-num">1</div>
                <div className="ios-step-text">
                  <span className="ios-step-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
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

            <div className="ios-note">💡 Make sure you're using <strong>Safari</strong> browser</div>

            <button className="btn btn-secondary" onClick={() => setShowIOSModal(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="ios-modal-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ios-modal-close" onClick={() => setShowLoginPrompt(false)}>✕</button>
            <h2>Sign in to subscribe</h2>
            <p className="ios-modal-subtitle">Log in with Google to complete your subscription.</p>
            <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <GoogleLoginButton onLogin={(u) => { onLogin?.(u); setShowLoginPrompt(false); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuScreen;
