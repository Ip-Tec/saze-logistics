"use client";
import React, { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function ConfirmEmail() {
  const { resendConfirmationEmail } = useAuthContext();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendConfirmationEmail();
      toast.success("Confirmation email resent. Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend confirmation email.");
    }
    setIsResending(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-semibold mb-4 text-center">Confirm Your Email</h1>
        <p className="text-gray-700 mb-6 text-center">
          A confirmation email has been sent to your address. Please check your inbox (and spam folder) and click the link to complete your registration.
        </p>
        <button
          onClick={handleResend}
          disabled={isResending}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition"
        >
          {isResending ? "Resending..." : "Resend Confirmation Email"}
        </button>
      </div>
    </div>
  );
}
