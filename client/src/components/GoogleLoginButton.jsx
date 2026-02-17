import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";

export default function GoogleLoginButton({ onLogin }) {
  const base = import.meta.env.VITE_API_URL || `${window.location.origin.replace(/\/$/, "")}/api`;

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          const { data } = await api.post(
            "/auth/google",
            { token: credentialResponse.credential },
          );
          onLogin?.(data.user);
        } catch (err) {
          const details = err?.response?.data?.error || err.message || "Unknown error";
          console.error("Google login failed", details);
          alert(`Google login failed. ${details}`);
        }
      }}
      onError={() => {
        console.log("Login Failed");
        alert("Google login was cancelled or failed.");
      }}
    />
  );
}
