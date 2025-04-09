"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function ConfirmEmail() {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const email = localStorage.getItem("pending-confirmation-email");
      if (!email) throw new Error("No pending email—please log in.");

      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        toast.error("You’ve hit the resend limit. Please wait an hour.");
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to resend.");
      toast.success("Confirmation email resent!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center rounded-2xl shadow-2xl bg-white/30 p-4">
      <div className="max-w-md bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">Confirm Your Email</h1>
        <p className="text-gray-700 mb-6">
          Check your inbox (and spam) and click the link. Didn't get it?
        </p>
        <button
          onClick={handleResend}
          disabled={isResending}
          className={`w-full py-3 rounded-lg font-medium transition ${
            isResending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-br from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-amber-500"
          } text-white`}
        >
          {isResending ? "Resending…" : "Resend Confirmation Email"}
        </button>
      </div>
    </div>
  );
}
