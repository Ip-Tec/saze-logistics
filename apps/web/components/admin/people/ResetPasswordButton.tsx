// components/admin/people/ResetPasswordButton.tsx

import { supabaseFE } from "@shared/supabaseClient";
import ActionButton from "@/components/admin/people/ActionButton";
import { toast } from "react-toastify";

export default function ResetPasswordButton({ email }: { email: string }) {
  const handleReset = async () => {
    const { error } = await supabaseFE.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
    });
    if (error) return toast.error("Error: " + error.message);
    toast.success("Reset email sent!");
  };

  return (
    <ActionButton
      label="Reset Password"
      onClick={handleReset}
      colorClass="bg-yellow-500 text-white"
    />
  );
}
