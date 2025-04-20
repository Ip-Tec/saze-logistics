import { useAuthContext } from "@/context/AuthContext";

import { supabase } from "@shared/supabaseClient";
import { toast } from "react-toastify";

export function useAuthHook() {
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      // 1) guard against identical passwords
      if (currentPassword === newPassword) {
        toast.error(
          "Your new password must be different from the current one."
        );
        return false;
      }

      // 2) (optional) re‑authenticate here if you want —
      //    Supabase doesn’t require it, but it’s more secure.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        toast.error(userError?.message || "No user email found.");
        return false;
      }

      // 3) update
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // 4) catch the 422 from Supabase
        if (error.status === 422) {
          toast.error(error.message); // “New password should be different…”
        } else {
          toast.error("Password update failed: " + error.message);
        }
        return false;
      }

      toast.success("Password changed successfully!");
      return true;
    } catch (err: any) {
      toast.error("Unexpected error: " + err.message);
      return false;
    }
  };

  return { changePassword };
}
