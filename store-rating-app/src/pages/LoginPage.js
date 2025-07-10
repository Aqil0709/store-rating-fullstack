import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (user) => {
    console.log("User logged in:", user);
    navigate("/dashboard");
  };

  return <LoginForm onLogin={handleLogin} />;
}
