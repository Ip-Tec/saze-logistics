// apps/web/components/auth/ChangePassword.tsx
import { toast, ToastContainer } from "react-toastify";
import React, { useState } from "react";
import GlassDiv from "@/components/ui/GlassDiv";
import Section from "@/components/reuse/Section";
import GlassButton from "@/components/ui/GlassButton";
import InputPassword from "@/components/reuse/InputPassword";

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
  onFail?: () => void;
  className?: string;
  buttonStyle?: string;
};

// This function now calls your server-side API route
const changePasswordNow = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Basic client-side validation (can add more like complexity checks)
    if (currentPassword === newPassword) {
      console.log("Your new password must be different from the current one.");

      return {
        success: false,
        message: "Your new password must be different from the current one.",
      };
    }
    if (newPassword.length < 8) {
      // Example: Minimum length check
      console.log("New password must be at least 8 characters long.");

      return {
        success: false,
        message: "New password must be at least 8 characters long.",
      };
    }

    // Call the server-side API route to handle password change with re-authentication
    const response = await fetch("/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const result = await response.json();
    console.log({ response });
    // Handle response from the API route
    if (response.ok) {
      console.log("Password changed successfully!");

      return {
        success: true,
        message: result.message || "Password changed successfully!",
      };
    } else {
      // API route returned an error status
      console.log("Failed to change password.");

      return {
        success: false,
        message: result.error || "Failed to change password.",
      };
    }
  } catch (err: any) {
    console.error("Client-side error calling change-password API:", err);
    console.log("An unexpected error occurred. Please try again.");

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};

export default function ChangePassword({ className, buttonStyle }: Props) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async () => {
    console.log("Attempting password change via API");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      console.log("New passwords do not match!");

      toast.error("New passwords do not match!");
      setLoading(false);
      return;
    }

    // Basic client-side validation before sending to API
    if (newPassword.length < 8) {
      console.log("New password must be at least 8 characters long.");

      toast.error("New password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
    // Add other client-side validation here as needed

    try {
      const result = await changePasswordNow(currentPassword, newPassword);

      if (result.success) {
        toast.success(result.message);
        // Clear fields on success
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.message); // Display error message from the API
      }
    } catch (error) {
      // This catch is for unexpected errors during the API call itself
      console.error("Error during password change API call:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassDiv
      className={`w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4 ${className}`}
    >
      <ToastContainer className="!absolute !top-3 " />
      <Section title="Change Password">
        <p className="text-sm">
          Update your password to keep your account secure.
        </p>
        <InputPassword
          disabled={loading}
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <InputPassword
          disabled={loading}
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
        />
        <InputPassword
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={loading}
        />
        <GlassButton
          className={`py-2 px-6 rounded ${buttonStyle}`}
          onClick={handlePasswordChange}
          disabled={loading} // Disable button while loading
        >
          {loading ? "Changing Password..." : "Change Password"}
        </GlassButton>
      </Section>
    </GlassDiv>
  );
}
