import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function GoogleLoginButton({ onLogin }) {
  const API_URL = import.meta.env.VITE_API_URL || 
    `${window.location.origin.replace(/\/$/, "")}/api`;

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/google`,
            { token: credentialResponse.credential },
          );
          onLogin?.(data.user);
        } catch (err) {
          console.error("Google login failed", err);
          alert("Google login failed. Please try again.");
        }
      }}
      onError={() => {
        console.log("Login Failed");
        alert("Google login was cancelled or failed.");
      }}
    />
  );
}
