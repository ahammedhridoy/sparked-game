import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function GoogleLoginButton({ onLogin }) {
  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        const { data } = await axios.post(
          "http://localhost:5001/api/auth/google",
          { token: credentialResponse.credential },
        );
        onLogin(data.user);
      }}
      onError={() => {
        console.log("Login Failed");
      }}
    />
  );
}
