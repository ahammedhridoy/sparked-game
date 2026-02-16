import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001/api`;

export const CheckoutSuccess = ({ onUserUpdate }) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const verify = async () => {
      const sessionId = params.get("session_id");
      if (!sessionId) {
        setStatus("missing");
        return;
      }
      try {
        // Give webhook a moment to process
        await new Promise((r) => setTimeout(r, 1500));
        // Try to refresh user from localStorage
        const raw = localStorage.getItem("sparked_user");
        if (raw) {
          const current = JSON.parse(raw);
          // fetch by id
          const { data } = await axios.get(`${API_BASE}/auth/me`, {
            params: { id: current.id },
          });
          const updated = data.user;
          localStorage.setItem("sparked_user", JSON.stringify(updated));
          if (typeof onUserUpdate === "function") onUserUpdate(updated);
        }
        setStatus("complete");
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    };
    verify();
  }, [params]);

  return (
    <div className="screen-layout">
      <div className="menu-container" style={{ textAlign: "center" }}>
        <h1 className="gradient-title">🎉 Thank you!</h1>
        {status === "verifying" && <p>Finalizing your subscription...</p>}
        {status === "complete" && (
          <>
            <p>Your VIP subscription is active. Enjoy unlimited play!</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Menu</button>
          </>
        )}
        {status === "missing" && (
          <>
            <p>Missing checkout session. If you completed payment, your status may still update shortly.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Menu</button>
          </>
        )}
        {status === "error" && (
          <>
            <p>We had trouble verifying. Please contact support or try again.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Menu</button>
          </>
        )}
      </div>
    </div>
  );
};

export const CheckoutCancel = () => {
  const navigate = useNavigate();
  return (
    <div className="screen-layout">
      <div className="menu-container" style={{ textAlign: "center" }}>
        <h1 className="gradient-title">Payment canceled</h1>
        <p>No charges were made. You can try again anytime.</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Menu</button>
      </div>
    </div>
  );
};