"use client";

import Link from "next/link";
import React, { useState } from "react";
import AuthCard from "@/components/AuthCard";
import { useAuthContext } from "@/context/AuthContext";

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuthContext();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setMessage("Check your email for the password reset link.");
    } catch (error) {
      console.error("Password reset failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <AuthCard title="Forgot Password">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg"
          >
            Reset Password
          </button>
          <Link
            href="/auth/login"
            className="text-blue-500 text-sm block text-justify"
          >
            Back to Login
          </Link>
        </form>
        {message && (
          <p className="text-green-500 text-center mt-4">{message}</p>
        )}
      </AuthCard>
    </div>
  );
};

export default ForgotPassword;
