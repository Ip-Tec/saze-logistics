
import { toast } from "react-toastify";
import React, { useState } from "react";
import GlassDiv from "@/components/ui/GlassDiv";
import Section from "@/components/reuse/Section";
import { useAuthHook } from "@/hooks/useAuthHook";
import GlassButton from "@/components/ui/GlassButton";
import InputPassword from "@/components/reuse/InputPassword";

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
  onFail?: () => void;
  className?: string;
  buttonStyle?: string;
};
export default function ChangePassword({ className, buttonStyle }: Props) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { changePassword } = useAuthHook();
  const handlePasswordChange = async () => {
    console.log("Changing password");
    setLoading(true);
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        toast.success("Password changed");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };
  return (
    <GlassDiv
      className={`w-full rounded-2xl overflow-hidden md:w-[48%] space-y-4 ${className}`}
    >
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
        >
          {loading ? "Changing Password..." : "Change Password"}
        </GlassButton>
      </Section>
    </GlassDiv>
  );
}
